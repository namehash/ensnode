#!/usr/bin/env bash
# BOX: index a named config to historical completion, then graceful-stop. The output schema is left
# in place for the caller to dump/load. Real ENSRainbow heals (correct checkpoint, not a benchmark).
#
# Two modes:
#   MODE=full-backfill  — index to the live finalized tip (production warm-start). Incurs the RPC tail
#                         beyond the seed. build_id matches a deployed service with the same config.
#   MODE=end-block      — index deterministically to per-chain end blocks resolved from $TIMESTAMP
#                         (dev checkpoint). Requires TIMESTAMP + CHAIN_IDS.
#
# Env: MODE, CONFIG (alpha|mainnet|…), SHA, SCHEMA (box-local output schema name), ALCHEMY_API_KEY,
#      and for end-block mode: TIMESTAMP, CHAIN_IDS.
source "$(dirname "$0")/lib.sh"
require git
require pnpm
require psql
require curl

: "${MODE:?}" "${CONFIG:?}" "${SHA:?}" "${SCHEMA:?}"

# Kill our stack processes (ponder spawns node/tsx children that outlive the pnpm parent and would
# serve stale status on a reused box) and free their ports. Does NOT touch postgres.
kill_stack() {
  pkill -9 -f "ponder.js" 2>/dev/null || true
  pkill -9 -f "apps/ensrainbow/src/cli.ts" 2>/dev/null || true
  pkill -9 -f "apps/ensapi" 2>/dev/null || true
  local p pids
  for p in "$ENSRAINBOW_PORT" "$ENSAPI_PORT" 42069 42070; do
    pids=$(ss -ltnHp "sport = :$p" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)
    # shellcheck disable=SC2086  # intentional word-split: $pids may be multiple space-separated PIDs
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  done
  return 0
}

log "rehydrating storage + ponder_sync from R2"
bash "$LIB_DIR/remote-rehydrate.sh"
kill_stack
sleep 2

# ── repo @ SHA ────────────────────────────────────────────────────────────────
if [ ! -d "$REPO_DIR/.git" ]; then
  log "cloning $REPO_URL -> $REPO_DIR"
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR" || die "cannot cd to $REPO_DIR"
log "checking out $SHA"
git fetch --all --quiet
git checkout --quiet "$SHA"
log "pnpm install"
pnpm install --frozen-lockfile

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
log "loading config identity from $CONFIG_ENV"
set -a
# shellcheck disable=SC1090
source "$CONFIG_ENV"
set +a
: "${NAMESPACE:?}" "${PLUGINS:?}" "${LABEL_SET_ID:?}" "${LABEL_SET_VERSION:?}"

# ── ensrainbow (real heals) — fresh labelset attach ──────────────────────────
log "starting ensrainbow on :$ENSRAINBOW_PORT (labelset=$LABEL_SET_ID v$LABEL_SET_VERSION)"
pkill -9 -f "apps/ensrainbow/src/cli.ts" 2>/dev/null || true
rm -f "$ENSRAINBOW_DATA_DIR/ensrainbow_db_ready"
sleep 1
(cd "$REPO_DIR/apps/ensrainbow" &&
  DATA_DIR="$ENSRAINBOW_DATA_DIR" LABEL_SET_ID="$LABEL_SET_ID" LABEL_SET_VERSION="$LABEL_SET_VERSION" \
    PORT="$ENSRAINBOW_PORT" pnpm run entrypoint >/tmp/ensrainbow.log 2>&1) &
RAINBOW_MARKER="$ENSRAINBOW_DATA_DIR/ensrainbow_db_ready"
for _ in $(seq 1 720); do
  [ -f "$RAINBOW_MARKER" ] && curl -fsS "http://localhost:$ENSRAINBOW_PORT/health" >/dev/null 2>&1 && break
  sleep 5
done
[ -f "$RAINBOW_MARKER" ] || die "ensrainbow DB did not become ready (see /tmp/ensrainbow.log)"

# ── per-chain end blocks (end-block mode only) ───────────────────────────────
END_BLOCK_LINES=""
if [ "$MODE" = "end-block" ]; then
  : "${TIMESTAMP:?}" "${CHAIN_IDS:?}"
  END_BLOCK_LINES="$(MANIFEST_OUT="/tmp/${SCHEMA}.blocks.json" bash "$LIB_DIR/remote-resolve-end-blocks.sh")"
fi

# ── .env.local: identity + runtime ───────────────────────────────────────────
ENV_FILE="$REPO_DIR/apps/ensindexer/.env.local"
log "writing $ENV_FILE (mode=$MODE, config=$CONFIG, schema=$SCHEMA)"
{
  echo "NAMESPACE=$NAMESPACE"
  echo "PLUGINS=$PLUGINS"
  echo "LABEL_SET_ID=$LABEL_SET_ID"
  echo "LABEL_SET_VERSION=$LABEL_SET_VERSION"
  [ -n "${SUBGRAPH_COMPAT:-}" ] && echo "SUBGRAPH_COMPAT=$SUBGRAPH_COMPAT"
  echo "ENSINDEXER_SCHEMA_NAME=$SCHEMA"
  echo "ENSDB_URL=$ENSDB_URL"
  echo "ENSRAINBOW_URL=http://localhost:$ENSRAINBOW_PORT"
  echo "ALCHEMY_API_KEY=$ALCHEMY_API_KEY"
  [ -n "$END_BLOCK_LINES" ] && echo "$END_BLOCK_LINES"
} >"$ENV_FILE"

log "dropping any prior schema $SCHEMA"
pg -c "drop schema if exists \"$SCHEMA\" cascade;"

# ── indexer (detached) + ensapi (status polling) ─────────────────────────────
INDEXER_LOG="/tmp/${SCHEMA}-indexer.log"
log "starting indexer -> $INDEXER_LOG"
(cd "$REPO_DIR/apps/ensindexer" &&
  setsid bash -c "ENSINDEXER_SCHEMA_NAME='$SCHEMA' pnpm start > '$INDEXER_LOG' 2>&1" </dev/null &)

log "starting ensapi on :$ENSAPI_PORT (retry until indexer metadata ready)"
setsid bash -c "cd '$REPO_DIR/apps/ensapi'; while true; do
  NAMESPACE='$NAMESPACE' ENSDB_URL='$ENSDB_URL' ENSINDEXER_SCHEMA_NAME='$SCHEMA' \
    ALCHEMY_API_KEY='$ALCHEMY_API_KEY' PORT='$ENSAPI_PORT' pnpm start >> '/tmp/${SCHEMA}-ensapi.log' 2>&1 || true
  sleep 15
done" </dev/null >/dev/null 2>&1 &

# ── wait for historical backfill completion (authoritative: is_ready 0->1) ───
log "waiting for is_ready=1 (historical backfill complete)"
while true; do
  if grep -qE "unhandledRejection|Started shutdown|index row requires|ELIFECYCLE|Failed to shutdown" "$INDEXER_LOG" 2>/dev/null; then
    warn "indexer crashed:"
    tail -50 "$INDEXER_LOG" >&2
    die "indexer crashed before is_ready"
  fi
  status="$(bash "$LIB_DIR/detect-done.sh" "$SCHEMA")"
  echo "$(date +%H:%M:%S) $status" >&2
  echo "$status" | grep -q "is_ready=1" && break
  sleep 30
done
log "is_ready=1 — backfill complete"

# ── graceful stop so the schema's ponder state is quiescent for the dump ─────
log "graceful-stopping the indexer (pattern: ponder.js)"
pkill -TERM -f "ponder.js" 2>/dev/null || true
for _ in $(seq 1 60); do
  pgrep -f "[p]onder.js" >/dev/null 2>&1 || break
  sleep 2
done
pkill -9 -f "ponder.js" 2>/dev/null || true
log "run complete: schema $SCHEMA ready for dump."
echo "RUN_DONE_OK schema=$SCHEMA"
