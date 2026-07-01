#!/usr/bin/env bash
# BOX: index ONE config to historical completion in an isolated process group, then graceful-stop
# only that config's processes. The output schema is left in place for the caller to dump/load. Real
# ENSRainbow heals (correct checkpoint, not a benchmark).
#
# Parallel-safe: the caller assigns a unique INDEXER_PORT / RAINBOW_PORT / RAINBOW_DATA_DIR per config
# so two configs can index concurrently on one box, sharing the local postgres + ponder_sync. Each
# config runs its own ENSRainbow (labelsets differ: alpha=searchlight/1, mainnet=subgraph/0) and its
# own Ponder in a dedicated process group, so graceful-stop never touches the sibling config.
#
# Requires remote-checkout.sh (repo @ SHA, deps) + remote-rehydrate.sh (postgres up, ponder_sync) to
# have run first.
#
# Two modes:
#   MODE=full-backfill  — index to the live finalized tip (production warm-start). build_id matches a
#                         deployed service with the same config.
#   MODE=end-block      — index deterministically to per-chain end blocks resolved from $TIMESTAMP
#                         (dev checkpoint). Requires TIMESTAMP; the indexed chain IDs are derived from
#                         the config itself (not passed in).
#
# Env: MODE, CONFIG, SHA, SCHEMA (box-local output schema), INDEXER_PORT, RAINBOW_PORT,
#      RAINBOW_DATA_DIR, ALCHEMY_API_KEY, and for end-block mode: TIMESTAMP.
source "$(dirname "$0")/lib.sh"
require pnpm
require psql
require curl

: "${MODE:?}" "${CONFIG:?}" "${SHA:?}" "${SCHEMA:?}"
: "${INDEXER_PORT:?}" "${RAINBOW_PORT:?}" "${RAINBOW_DATA_DIR:?}"
: "${ENSDB_URL:?}" # box-local postgres (default from config.example.sh); feeds the indexer's env below

# ── config identity (the single source of truth for build_id parity) ─────────
# Prefer the config shipped alongside the scripts (from the orchestrating branch) over the one in the
# indexed commit's tree — so we can index commits that predate these config files (e.g. dev checkpoints
# of old commits). For the production RC flow the two are identical.
CONFIG_ENV=""
for cand in "$LIB_DIR/configs/${CONFIG}.env" "$REPO_DIR/apps/ensindexer/configs/${CONFIG}.env"; do
  [ -f "$cand" ] && {
    CONFIG_ENV="$cand"
    break
  }
done
[ -n "$CONFIG_ENV" ] || die "config env not found for '$CONFIG' (looked in $LIB_DIR/configs and $REPO_DIR/apps/ensindexer/configs)"
log "[$CONFIG] loading config identity from $CONFIG_ENV"
set -a
# shellcheck disable=SC1090
source "$CONFIG_ENV"
set +a
: "${NAMESPACE:?}" "${PLUGINS:?}" "${LABEL_SET_ID:?}" "${LABEL_SET_VERSION:?}"

# ── ensrainbow (real heals) — per-config labelset on its own port/data dir ───
log "[$CONFIG] starting ensrainbow on :$RAINBOW_PORT (labelset=$LABEL_SET_ID v$LABEL_SET_VERSION)"
mkdir -p "$RAINBOW_DATA_DIR"
rm -f "$RAINBOW_DATA_DIR/ensrainbow_db_ready"
sleep 1
# setsid (NOT a bare `( … ) &`): ENSRainbow is a long-lived server. As a direct background child it
# wedges this shell's later `$(detect-done.sh)` command substitution — bash blocks in wait4() on the
# never-exiting child, so the wait loop never runs and the checkpoint never completes. setsid detaches
# it into its own session (like the indexer below), and </dev/null closes the last inherited fd.
setsid bash -c "cd '$REPO_DIR/apps/ensrainbow' && \
  DATA_DIR='$RAINBOW_DATA_DIR' LABEL_SET_ID='$LABEL_SET_ID' LABEL_SET_VERSION='$LABEL_SET_VERSION' \
    PORT='$RAINBOW_PORT' exec pnpm run entrypoint" </dev/null >"/tmp/ensrainbow-$CONFIG.log" 2>&1 &
RAINBOW_MARKER="$RAINBOW_DATA_DIR/ensrainbow_db_ready"
rainbow_ready=0
for _ in $(seq 1 720); do
  if [ -f "$RAINBOW_MARKER" ] && curl -fsS "http://localhost:$RAINBOW_PORT/health" >/dev/null 2>&1; then
    rainbow_ready=1
    break
  fi
  sleep 5
done
# Require BOTH the DB marker AND a live health response — a marker alone (server not actually serving)
# would let the indexer start against a dead ENSRainbow and heal nothing.
[ "$rainbow_ready" = "1" ] || die "[$CONFIG] ensrainbow did not become ready+healthy on :$RAINBOW_PORT (see /tmp/ensrainbow-$CONFIG.log)"

# ── per-chain end blocks (end-block mode only) ───────────────────────────────
# Derive the indexed chain IDs from the config itself (rather than passing a CHAIN_IDS list), then
# resolve each chain's end block for $TIMESTAMP from the ponder_sync cache.
END_BLOCK_ENV=()
if [ "$MODE" = "end-block" ]; then
  : "${TIMESTAMP:?}"
  log "[$CONFIG] deriving indexed chain ids from config"
  CHAIN_IDS="$(cd "$REPO_DIR/apps/ensindexer" &&
    ENSRAINBOW_URL="http://localhost:$RAINBOW_PORT" ENSINDEXER_SCHEMA_NAME="$SCHEMA" \
      pnpm exec tsx scripts/print-indexed-chain-ids.ts | paste -sd, -)"
  [ -n "$CHAIN_IDS" ] || die "[$CONFIG] could not derive indexed chain ids from config"
  log "[$CONFIG] indexed chains: $CHAIN_IDS"
  # Resolve into a file and check the exit code explicitly — a process substitution would swallow a
  # `die` in the resolver (the while loop would read partial output and exit 0), leaving some chains
  # without an end block and silently indexing them to realtime.
  END_BLOCKS_OUT="/tmp/${SCHEMA}.endblocks"
  CHAIN_IDS="$CHAIN_IDS" MANIFEST_OUT="/tmp/${SCHEMA}.blocks.json" \
    bash "$LIB_DIR/remote-resolve-end-blocks.sh" >"$END_BLOCKS_OUT" ||
    die "[$CONFIG] end-block resolution failed (cache may not cover all chains at timestamp $TIMESTAMP)"
  while IFS= read -r line; do
    [ -n "$line" ] && END_BLOCK_ENV+=("$line")
  done <"$END_BLOCKS_OUT"
fi

log "[$CONFIG] dropping any prior schema $SCHEMA"
pg -c "drop schema if exists \"$SCHEMA\" cascade;"

# ── indexer (own process group on $INDEXER_PORT) ─────────────────────────────
# Identity + runtime passed inline as process env (no shared .env.local — two configs run from the
# same repo dir). setsid puts ponder + its node/tsx children in a fresh process group whose leader pid
# we capture, so graceful-stop signals exactly this config's tree, never the sibling's.
INDEXER_LOG="/tmp/${SCHEMA}-indexer.log"
INDEXER_ENV=(
  "NAMESPACE=$NAMESPACE"
  "PLUGINS=$PLUGINS"
  "LABEL_SET_ID=$LABEL_SET_ID"
  "LABEL_SET_VERSION=$LABEL_SET_VERSION"
  "ENSINDEXER_SCHEMA_NAME=$SCHEMA"
  "ENSDB_URL=$ENSDB_URL"
  "ENSRAINBOW_URL=http://localhost:$RAINBOW_PORT"
  "ALCHEMY_API_KEY=${ALCHEMY_API_KEY:-}"
)
[ -n "${SUBGRAPH_COMPAT:-}" ] && INDEXER_ENV+=("SUBGRAPH_COMPAT=$SUBGRAPH_COMPAT")
[ "${#END_BLOCK_ENV[@]}" -gt 0 ] && INDEXER_ENV+=("${END_BLOCK_ENV[@]}")

log "[$CONFIG] starting indexer on :$INDEXER_PORT (mode=$MODE, schema=$SCHEMA) -> $INDEXER_LOG"
# Run in a fresh session (setsid) so this config's ponder + its node/tsx children form an isolated
# process group we can graceful-stop without touching the sibling config. setsid may fork, so we
# cannot trust $! — instead the session leader records its OWN pid ($$ after setsid == the new pgid)
# to a file, which we read back. exec keeps that pid as the live process.
PGID_FILE="/tmp/${SCHEMA}.pgid"
rm -f "$PGID_FILE"
setsid bash -c \
  "echo \$\$ > '$PGID_FILE'; cd '$REPO_DIR/apps/ensindexer' && exec env $(printf '%q ' "${INDEXER_ENV[@]}")pnpm exec ponder --root ./ponder start --schema '$SCHEMA' --port '$INDEXER_PORT'" \
  >"$INDEXER_LOG" 2>&1 </dev/null &
for _ in $(seq 1 50); do [ -s "$PGID_FILE" ] && break; sleep 0.1; done
INDEXER_PGID="$(tr -d '[:space:]' <"$PGID_FILE" 2>/dev/null || true)"
[ -n "$INDEXER_PGID" ] || die "[$CONFIG] could not determine indexer process group id"

# ── wait for historical backfill completion (authoritative: is_ready 0->1) ───
# Crash detection is process-liveness-first (robust to new Ponder error modes): if the indexer's
# process group dies before is_ready flips, that's a crash regardless of the log text. The error-string
# scan is a secondary fast-path so we surface a clear failure without waiting for the process to exit.
log "[$CONFIG] waiting for is_ready=1 (historical backfill complete)"
while true; do
  status="$(bash "$LIB_DIR/detect-done.sh" "$SCHEMA")"
  # Surface Ponder's own latest backfill progress (%, ETA) alongside the authoritative readiness probe.
  prog="$(grep -aE "Updated backfill indexing progress" "$INDEXER_LOG" 2>/dev/null | tail -1 | sed -E 's/.*(progress=.*)$/\1/')"
  echo "$(date +%H:%M:%S) [$CONFIG] $status${prog:+ | $prog}" >&2
  echo "$status" | grep -q "is_ready=1" && break
  if ! kill -0 -- "-$INDEXER_PGID" 2>/dev/null; then
    warn "[$CONFIG] indexer process group exited before is_ready:"
    tail -50 "$INDEXER_LOG" >&2
    die "[$CONFIG] indexer died before is_ready"
  fi
  if grep -qE "unhandledRejection|Started shutdown|index row requires|ELIFECYCLE|Failed to shutdown" "$INDEXER_LOG" 2>/dev/null; then
    warn "[$CONFIG] indexer crashed (matched error pattern):"
    tail -50 "$INDEXER_LOG" >&2
    die "[$CONFIG] indexer crashed before is_ready"
  fi
  sleep 30
done
log "[$CONFIG] is_ready=1 — backfill complete"

# ── graceful stop (this config's process group only) ─────────────────────────
log "[$CONFIG] graceful-stopping the indexer (pgid $INDEXER_PGID)"
kill -TERM -- "-$INDEXER_PGID" 2>/dev/null || true
for _ in $(seq 1 60); do
  kill -0 -- "-$INDEXER_PGID" 2>/dev/null || break
  sleep 2
done
kill -9 -- "-$INDEXER_PGID" 2>/dev/null || true
log "[$CONFIG] run complete: schema $SCHEMA ready for dump."
echo "RUN_DONE_OK config=$CONFIG schema=$SCHEMA"
