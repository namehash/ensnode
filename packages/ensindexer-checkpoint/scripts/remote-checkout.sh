#!/usr/bin/env bash
# BOX: shared, cheap setup — stop any stale stack, check out the repo @ SHA, install deps, and build
# ensdb-cli. Does NOT touch storage/postgres (see remote-rehydrate.sh for the heavy ponder_sync
# restore). Safe to run once per box before indexing or loading.
#
# Env: SHA (commit to check out).
source "$(dirname "$0")/lib.sh"
require git
require pnpm

: "${SHA:?}"

# Stop any stack processes left by a reused box (ponder spawns node/tsx children that outlive the
# pnpm parent and would serve stale state or hold ports). Does NOT touch postgres. Frees every port
# the parallel-config indexing may use (two indexers + two ensrainbows).
kill_stack() {
  pkill -9 -f "ponder.js" 2>/dev/null || true
  pkill -9 -f "apps/ensrainbow/src/cli.ts" 2>/dev/null || true
  pkill -9 -f "apps/ensapi" 2>/dev/null || true
  local p pids
  for p in 42069 42070 42169 42170 3223 3224 4334; do
    pids=$(ss -ltnHp "sport = :$p" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)
    # shellcheck disable=SC2086  # intentional word-split: $pids may be multiple space-separated PIDs
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  done
  return 0
}

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

log "building ensdb-cli"
pnpm -F @ensnode/ensdb-cli build >/dev/null

log "checkout complete: repo @ $SHA, ensdb-cli built."
echo "CHECKOUT_DONE_OK sha=$SHA"
