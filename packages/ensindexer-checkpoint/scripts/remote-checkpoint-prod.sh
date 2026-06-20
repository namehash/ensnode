#!/usr/bin/env bash
# BOX: production orchestrator — index BOTH mainnet-namespace configs (alpha, mainnet) IN PARALLEL on
# this one box, sharing the local postgres + ponder_sync cache, then dump each as a sha-keyed R2
# checkpoint, load each into the target ENSDb as <prefix><VERSION>, and refresh the canonical R2 seed
# once. Idempotent + R2-locked.
#
# Co-location wins (vs one box per config): the ~200GB ponder_sync seed is restored once, not twice,
# and the shared chain-1 RPC tail is fetched once. Ponder's indexing loop is single-threaded, so two
# configs comfortably fit one high-core box (each its own process group, schema, and ENSRainbow).
#
# Flow:
#   - acquire R2 lock prod-<SHA>; release on exit
#   - checkout repo @ SHA + build ensdb-cli (always — needed for dump/load)
#   - for each config whose checkpoints/<config>-<SHA>.dump is missing in R2:
#       rehydrate (once) -> index all-missing in parallel -> dump each -> upload sha-keyed to R2
#   - if DO_LOAD=1 -> load each config's dump into TARGET_URL as <prefix><VERSION> (--skip-if-exists)
#   - if DO_SEED=1 -> refresh the canonical R2 seed from the (now enriched) shared ponder_sync
#
# Env: SHA, VERSION, ALCHEMY_API_KEY, DO_LOAD(0/1)[+TARGET_URL], DO_SEED(0/1).
source "$(dirname "$0")/lib.sh"
require rclone
require pnpm
require node
require psql

: "${SHA:?}" "${VERSION:?}"
DO_LOAD="${DO_LOAD:-0}"
DO_SEED="${DO_SEED:-0}"

# Configs indexed on Cherry (the two heavy mainnet-namespace configs). Per-config, parallel-safe ports
# + the target schema prefix (schema name = <prefix><VERSION>, matching deploy_ensnode_blue_green.yml).
CONFIGS=(alpha mainnet)
declare -A INDEXER_PORT=([alpha]=42069 [mainnet]=42169)
declare -A RAINBOW_PORT=([alpha]=3223 [mainnet]=3224)
declare -A SCHEMA_PREFIX=([alpha]=alphaSchema [mainnet]=mainnetSchema)

box_schema() { echo "ckpt_${1}_${SHA}"; }
ckpt_name() { checkpoint_object "$1" "$SHA" ""; } # <config>-<SHA>.dump

LOCK_KEY="prod-${SHA}"
acquire_lock "$LOCK_KEY"
trap 'release_lock "$LOCK_KEY"' EXIT

ensdb_cli() { node "$REPO_DIR/packages/ensdb-cli/dist/cli.js" "$@"; }

log "checkout repo @ $SHA (+ build ensdb-cli)"
SHA="$SHA" bash "$LIB_DIR/remote-checkout.sh"

# ── which configs still need indexing? (sha-keyed checkpoint already in R2 -> reuse) ──
NEED=()
for c in "${CONFIGS[@]}"; do
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
  for c in "${NEED[@]}"; do
    sch="$(box_schema "$c")"
    CONFIG="$c" SHA="$SHA" SCHEMA="$sch" MODE=full-backfill \
      INDEXER_PORT="${INDEXER_PORT[$c]}" RAINBOW_PORT="${RAINBOW_PORT[$c]}" \
      RAINBOW_DATA_DIR="$DATA_MOUNT/ensrainbow-$c" ALCHEMY_API_KEY="${ALCHEMY_API_KEY:-}" \
      bash "$LIB_DIR/remote-index-one.sh" >"/tmp/index-$c.out" 2>&1 &
    PID[$c]=$!
    log "  -> $c indexing (pid ${PID[$c]}, schema $sch, indexer :${INDEXER_PORT[$c]}, rainbow :${RAINBOW_PORT[$c]})"
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
    mn="${cn%.dump}.metadata.json"
    ld="$DATA_MOUNT/$cn"
    lm="$DATA_MOUNT/$mn"
    log "[$c] dumping schema $sch -> $ld (+ metadata)"
    ensdb_cli dump "$sch" --from "$ENSDB_URL" -f "$ld" --metadata-out "$lm"
    log "[$c] uploading checkpoint + metadata to R2"
    rclone copyto "$ld" "$(r2_checkpoint "$cn")"
    rclone copyto "$lm" "$(r2_checkpoint "$mn")"
  done
fi

# ── load each config into the target ENSDb as <prefix><VERSION> ──────────────
if [ "$DO_LOAD" = "1" ]; then
  : "${TARGET_URL:?}"
  mkdir -p "$DATA_MOUNT"
  for c in "${CONFIGS[@]}"; do
    cn="$(ckpt_name "$c")"
    mn="${cn%.dump}.metadata.json"
    ld="$DATA_MOUNT/$cn"
    lm="$DATA_MOUNT/$mn"
    if [ ! -f "$ld" ]; then
      log "[$c] downloading $cn from R2 for load"
      rclone copy "$(r2_checkpoint "$cn")" "$DATA_MOUNT/"
      rclone copy "$(r2_checkpoint "$mn")" "$DATA_MOUNT/" 2>/dev/null || warn "[$c] no metadata object for $cn"
    fi
    meta_arg=()
    [ -f "$lm" ] && meta_arg=(--metadata "$lm")
    tgt="${SCHEMA_PREFIX[$c]}${VERSION}"
    log "[$c] loading into target as $tgt (--skip-if-exists)"
    ensdb_cli load "$ld" --into "$TARGET_URL" --schema "$tgt" "${meta_arg[@]}" --skip-if-exists
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

log "remote-checkpoint-prod complete (sha=$SHA version=$VERSION)"
echo "CHECKPOINT_PROD_DONE_OK sha=$SHA version=$VERSION"
