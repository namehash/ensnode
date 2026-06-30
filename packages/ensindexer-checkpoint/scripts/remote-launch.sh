#!/usr/bin/env bash
# BOX: launch the checkpoint producer DETACHED, or report that it is already running/done — so the
# producer survives the SSH session (and thus a dead/reclaimed orchestrating runner), and a re-run can
# re-attach and keep supervising instead of restarting a multi-hour index from scratch. Idempotent.
#
# State files (in this script's dir, i.e. the shipped REMOTE_DIR):
#   checkpoint.log     — the producer's combined stdout/stderr (the supervisor streams this)
#   checkpoint.status  — written once the producer exits: DONE | FAILED
#   checkpoint.pgid    — the detached session's process-group id while it runs (removed on exit)
#
# Contract with the supervisor (checkpoint.sh): this returns immediately; readiness/outcome is read
# from checkpoint.log + checkpoint.status, never from this script's exit code.
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")" || die "cannot cd to script dir"

STATUS_FILE="checkpoint.status"
LOG_FILE="checkpoint.log"
PGID_FILE="checkpoint.pgid"

# A session is alive iff its recorded process group still has a live member.
session_alive() { [ -s "$PGID_FILE" ] && kill -0 -- "-$(cat "$PGID_FILE")" 2>/dev/null; }

if [ -f "$STATUS_FILE" ] && [ "$(cat "$STATUS_FILE")" = "DONE" ]; then
  log "producer already DONE — nothing to launch"
  exit 0
fi
if session_alive; then
  log "producer already running (pgid $(cat "$PGID_FILE")) — re-attaching, not relaunching"
  exit 0
fi

# Fresh start, or a prior FAILED/crashed session: (re)launch detached. setsid detaches the producer
# into its own session/process group so it is NOT killed when this SSH session ends; the session leader
# records its own pgid ($$ after setsid). .run-env (run params + secrets) is sourced into the detached
# process and then removed from disk.
rm -f "$STATUS_FILE"
: >"$LOG_FILE"
log "launching detached producer (setsid) -> $LOG_FILE"
setsid bash -c '
  echo "$$" >"'"$PGID_FILE"'"
  set -a; . ./.run-env; set +a
  rm -f ./.run-env
  if bash remote-checkpoint.sh; then echo DONE; else echo FAILED; fi >"'"$STATUS_FILE"'"
  rm -f "'"$PGID_FILE"'"
' </dev/null >>"$LOG_FILE" 2>&1 &

# Wait briefly for the session to record its pgid so the supervisor can detect liveness immediately.
for _ in $(seq 1 50); do [ -s "$PGID_FILE" ] && break; sleep 0.1; done
[ -s "$PGID_FILE" ] || die "detached producer did not start (no pgid recorded)"
log "detached producer launched (pgid $(cat "$PGID_FILE"))"
