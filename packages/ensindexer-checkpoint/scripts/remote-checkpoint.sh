#!/usr/bin/env bash
# BOX: produce checkpoints. Index one or more configs (in parallel, sharing the local postgres +
# ponder_sync), dump each as a sha-keyed R2 checkpoint, and optionally refresh the canonical R2 seed.
# Idempotent + R2-locked. This runs entirely on the disposable Cherry box; the LOAD into a target
# ENSDb is deliberately NOT here — it runs on the runner (load-checkpoints.sh) AFTER the box is torn
# down, since the restore is bound by the destination Postgres (RAM), not by this box, and a multi-hour
# restore should not keep bare metal running.
#
# This single path covers both flows; they differ only in inputs:
#   - production warm-start: CONFIGS="alpha mainnet" MODE=full-backfill DO_SEED=1
#   - dev point-in-time:     CONFIGS="<config>"      MODE=end-block TIMESTAMP=<unix>
#
# Flow:
#   - acquire one R2 lock for the run; release on exit
#   - checkout repo @ SHA + build ensdb-cli (needed for the dump)
#   - for each config whose sha-keyed checkpoint is missing in R2:
#       rehydrate (once) -> index all-missing in parallel -> dump each -> upload to R2
#   - if DO_SEED=1 -> refresh the canonical R2 seed from the (now enriched) shared ponder_sync
#
# Env: CONFIGS (space-separated), SHA, MODE (full-backfill|end-block), ALCHEMY_API_KEY,
#      TIMESTAMP (end-block only), DO_SEED(0/1).
source "$(dirname "$0")/lib.sh"
require rclone
require pnpm
require node
require psql

: "${CONFIGS:?}" "${SHA:?}" "${MODE:?}"
DO_SEED="${DO_SEED:-0}"
[ "$MODE" = "end-block" ] && : "${TIMESTAMP:?end-block mode requires TIMESTAMP}"

read -ra CONFIG_LIST <<<"$CONFIGS"
[ "${#CONFIG_LIST[@]}" -gt 0 ] || die "CONFIGS is empty"

# Checkpoint object suffix: dev (end-block) checkpoints are timestamp-specific; production
# (full-backfill) checkpoints are keyed by sha alone.
SUFFIX=""
[ "$MODE" = "end-block" ] && SUFFIX="-t${TIMESTAMP}"

# On-box (staging) schema name. Uses a SHORT sha so it stays under Postgres' 63-byte identifier limit
# even in end-block mode (full sha + `-t<timestamp>` would overflow and silently truncate). This name
# is box-local only — it does not affect build_id or the R2 checkpoint object name (which keep the full sha).
box_schema() { echo "ckpt_${1}_${SHA:0:12}${SUFFIX}"; }
ckpt_name() { checkpoint_object "$1" "$SHA" "$SUFFIX"; } # <config>-<sha>[-t<ts>].dump

LOCK_KEY="${CONFIGS// /+}-${SHA}${SUFFIX}"
acquire_lock "$LOCK_KEY"
trap 'release_lock "$LOCK_KEY"' EXIT

ensdb_cli() { node "$REPO_DIR/packages/ensdb-cli/dist/cli.js" "$@"; }

log "checkout repo @ $SHA (+ build ensdb-cli)"
SHA="$SHA" bash "$LIB_DIR/remote-checkout.sh"

# ── which configs still need indexing? (sha-keyed checkpoint already in R2 -> reuse) ──
NEED=()
for c in "${CONFIG_LIST[@]}"; do
  if r2_exists "$(r2_checkpoint "$(ckpt_name "$c")")"; then
    log "checkpoint for $c already in R2 ($(ckpt_name "$c")) — will reuse (skip indexing)"
  else
    NEED+=("$c")
  fi
done

# ── index the missing configs in parallel into the shared postgres ───────────
if [ "${#NEED[@]}" -gt 0 ]; then
  log "rehydrating storage + ponder_sync (shared by all configs)"
  bash "$LIB_DIR/remote-rehydrate.sh"

  log "indexing in parallel: ${NEED[*]}"
  declare -A PID
  i=0
  for c in "${NEED[@]}"; do
    sch="$(box_schema "$c")"
    CONFIG="$c" SHA="$SHA" SCHEMA="$sch" MODE="$MODE" \
      INDEXER_PORT="$((42069 + i * 100))" RAINBOW_PORT="$((3223 + i))" \
      RAINBOW_DATA_DIR="$DATA_MOUNT/ensrainbow-$c" ALCHEMY_API_KEY="${ALCHEMY_API_KEY:-}" \
      TIMESTAMP="${TIMESTAMP:-}" \
      bash "$LIB_DIR/remote-index-one.sh" >"/tmp/index-$c.out" 2>&1 &
    PID[$c]=$!
    log "  -> $c indexing (pid ${PID[$c]}, schema $sch, indexer :$((42069 + i * 100)), rainbow :$((3223 + i)))"
    i=$((i + 1))
  done

  FAIL=0
  for c in "${NEED[@]}"; do
    if wait "${PID[$c]}"; then
      log "$c index complete"
    else
      warn "$c index FAILED — last 80 lines:"
      tail -80 "/tmp/index-$c.out" >&2
      FAIL=1
    fi
  done
  [ "$FAIL" = 0 ] || die "one or more parallel indexes failed"

  log "dumping + uploading sha-keyed checkpoints for: ${NEED[*]}"
  for c in "${NEED[@]}"; do
    sch="$(box_schema "$c")"
    cn="$(ckpt_name "$c")"
    ld="$DATA_MOUNT/$cn"
    log "[$c] dumping schema $sch -> $ld (+ metadata sidecar)"
    ensdb_cli dump "$sch" --from "$ENSDB_URL" -f "$ld"
    log "[$c] uploading checkpoint + metadata to R2"
    rclone copyto "$ld" "$(r2_checkpoint "$cn")"
    rclone copyto "$ld.metadata.json" "$(r2_checkpoint "$cn.metadata.json")"
  done
fi

# ── refresh the canonical R2 seed once (shared ponder_sync now spans all chains) ──
if [ "$DO_SEED" = "1" ]; then
  if [ "${#NEED[@]}" -gt 0 ]; then
    log "refreshing canonical R2 seed from enriched ponder_sync"
    bash "$LIB_DIR/remote-seed-export.sh"
  else
    warn "DO_SEED=1 but nothing was indexed this run (all checkpoints reused) — skipping seed refresh"
  fi
fi

log "remote-checkpoint complete (configs='$CONFIGS' sha=$SHA mode=$MODE)"
echo "CHECKPOINT_DONE_OK configs='$CONFIGS' sha=$SHA"
