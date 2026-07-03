#!/usr/bin/env bash
# The unified manual runner (the GitHub workflows orchestrate the same steps). Brings ONE Cherry box
# up, ships scripts + configs + an rclone.conf, provisions it, runs remote-checkpoint.sh to produce the
# checkpoints (index → dump → upload to R2 → optional seed refresh), then tears the box down. If
# DO_LOAD=1 it then runs the load on THIS machine (the runner) — after the box is gone — via
# load-checkpoints.sh, so a multi-hour restore (bound by the destination Postgres) doesn't keep bare
# metal alive.
#
#   production:  CONFIGS="alpha mainnet" SHA=<sha> VERSION=<v> MODE=full-backfill DO_LOAD=1 TARGET_URL=<url> DO_SEED=1
#   dev:         CONFIGS="<config>"      SHA=<sha>             MODE=end-block TIMESTAMP=<unix>
#
# Env:
#   CONFIGS       space-separated configs to index            (required)
#   SHA           commit to index                             (required)
#   MODE          full-backfill|end-block (default full-backfill)
#   TIMESTAMP     unix seconds (end-block mode only)
#   VERSION       release version for target schema names     (required when DO_LOAD=1)
#   DO_LOAD=1 + TARGET_URL                                    restore checkpoints into a target ENSDb (on the runner)
#   DO_SEED=1                                                 refresh the canonical R2 seed
#   KEEP_BOX=1                                                leave the box up afterwards (debugging)
source "$(dirname "$0")/lib.sh"

: "${CONFIGS:?}" "${SHA:?}"
MODE="${MODE:-full-backfill}"
DO_LOAD="${DO_LOAD:-0}"
REMOTE_DIR="checkpoint-scripts"
# Deterministic per-sha box hostname so a re-run (e.g. after the orchestrating runner died) discovers
# and RE-ATTACHES to the same still-running box instead of provisioning a fresh one. Still matches the
# reaper's `ensindexer-checkpoint-*` glob.
export BOX_HOSTNAME="ensindexer-checkpoint-${SHA:0:12}"
[ "$DO_LOAD" = "1" ] && : "${VERSION:?DO_LOAD requires VERSION}" "${TARGET_URL:?DO_LOAD requires TARGET_URL}"

cleanup() { [ "${KEEP_BOX:-0}" = "1" ] || bash "$LIB_DIR/cherry-down.sh"; }

log "checkpoint run: configs='$CONFIGS' sha=$SHA mode=$MODE"

# ── Runner-side R2 idempotency: skip the box ENTIRELY when nothing needs indexing ───────────────
# If every config's sha-keyed checkpoint already exists in R2, a box would only spin up, re-discover
# that, and skip — pure waste, and a hard failure when the Cherry balance is low or its API is flaky.
# A load-only re-run (e.g. after the box died post-upload, or a load bug) must not need bare metal.
# The load restores straight from R2, so go there directly without ever provisioning a box.
# (If rclone is absent the check fails closed — need_box=1 — falling back to the normal box path.)
SUFFIX=""
[ "$MODE" = "end-block" ] && SUFFIX="-t${TIMESTAMP:?end-block mode requires TIMESTAMP}"
mkdir -p "$HOME/.config/rclone"
write_rclone_conf "$HOME/.config/rclone/rclone.conf"
need_box=0
for c in $CONFIGS; do
  r2_exists "$(r2_checkpoint "$(checkpoint_object "$c" "$SHA" "$SUFFIX")")" || {
    need_box=1
    break
  }
done
if [ "$need_box" = "0" ]; then
  log "all checkpoints already in R2 ($CONFIGS @ ${SHA:0:12}) — skipping the Cherry box entirely"
  if [ "$DO_LOAD" = "1" ]; then
    log "restoring checkpoints into the target from R2 (no box needed)"
    CONFIGS="$CONFIGS" SHA="$SHA" VERSION="$VERSION" TARGET_URL="$TARGET_URL" \
      MODE="$MODE" TIMESTAMP="${TIMESTAMP:-}" \
      bash "$LIB_DIR/load-checkpoints.sh"
  fi
  log "checkpoint run complete (reused R2 checkpoints; no box needed)."
  exit 0
fi

bash "$LIB_DIR/cherry-up.sh"
trap cleanup EXIT

log "shipping scripts + configs + rclone.conf to the box"
on_box "mkdir -p ~/$REMOTE_DIR ~/$REMOTE_DIR/configs ~/.config/rclone"
scp_to_box "$LIB_DIR"/*.sh "$REMOTE_DIR/"
# Ship the canonical config identity from this (orchestrating) checkout so the indexed commit need
# not contain configs/*.env. CONFIGS_SRC resolves repo-root/apps/ensindexer/configs.
CONFIGS_SRC="$LIB_DIR/../../../apps/ensindexer/configs"
scp_to_box "$CONFIGS_SRC"/*.env "$REMOTE_DIR/configs/"
RCLONE_TMP="$(mktemp)"
write_rclone_conf "$RCLONE_TMP"
scp_to_box "$RCLONE_TMP" ".config/rclone/rclone.conf"
rm -f "$RCLONE_TMP"

# Ship run params via a 600 file, NOT as SSH-command argv (argv is readable in the box's process
# table). The box produces checkpoints only — TARGET_URL never reaches the box (the load runs here).
ENV_TMP="$(mktemp)"
write_env_file "$ENV_TMP" CONFIGS SHA MODE TIMESTAMP DO_SEED ALCHEMY_API_KEY
scp_to_box "$ENV_TMP" "$REMOTE_DIR/.run-env"
rm -f "$ENV_TMP"
on_box "chmod 600 ~/$REMOTE_DIR/.run-env"

if on_box "command -v pnpm >/dev/null 2>&1"; then
  log "toolchain present"
else
  log "provisioning toolchain"
  on_box "cd ~/$REMOTE_DIR && bash remote-provision.sh"
fi

log "launching detached producer on the box (the long part)"
# Launch the producer DETACHED on the box (or re-attach if it is already running/done). Because it is
# detached (setsid), it keeps running if THIS runner dies — and a re-run re-discovers the box
# (cherry-up by hostname) and re-enters the supervise loop below. The producer's progress is durable
# regardless: each config banks its checkpoint to R2 the moment it finishes (remote-checkpoint.sh), so
# even a fresh box on re-run reuses already-completed configs.
on_box "cd ~/$REMOTE_DIR && bash remote-launch.sh"

# Supervise: stream the producer's box log incrementally (so progress shows in the job log) and poll
# its status until DONE/FAILED. Each iteration is one short SSH — a dropped connection or dead runner
# does not stop the detached producer; re-running this workflow resumes supervision from offset 0.
#
# Heartbeat: some box phases are long and silent (seed download, pg_restore, a quiet indexing stretch),
# so streamed box output alone can leave the job log dark for many minutes. When a poll yields no new
# box output, emit a heartbeat at most every HEARTBEAT_SECS with elapsed time + producer status — so
# the job log always shows liveness (and any hang is visible as "still RUNNING after Nm"). GitHub does
# not kill a job for output-inactivity, but this keeps the run observable and connections warm.
HEARTBEAT_SECS="${SUPERVISE_HEARTBEAT_SECS:-120}"
log "supervising detached producer (streaming box log; survives runner restart)"
offset=0
start_ts="$(date +%s)"
last_emit="$start_ts"
while true; do
  chunk="$(on_box "tail -c +$((offset + 1)) ~/$REMOTE_DIR/checkpoint.log 2>/dev/null
echo
echo \"__OFF__\$(wc -c <~/$REMOTE_DIR/checkpoint.log 2>/dev/null || echo $offset)\"
echo \"__ST__\$(tail -1 ~/$REMOTE_DIR/checkpoint.status 2>/dev/null || echo RUNNING)\"" || true)"
  st="$(printf '%s\n' "$chunk" | sed -n 's/^__ST__//p' | tail -1)"
  newoff="$(printf '%s\n' "$chunk" | sed -n 's/^__OFF__//p' | tail -1)"
  # New box log bytes this poll (strip the marker lines + the trailing blank separator).
  body="$(printf '%s\n' "$chunk" | sed '/^__OFF__/d; /^__ST__/d' | sed -e '${/^$/d}')"
  now="$(date +%s)"
  if [ -n "$body" ]; then
    printf '%s\n' "$body" # box made progress — that IS the liveness signal
    last_emit="$now"
  elif [ "$((now - last_emit))" -ge "$HEARTBEAT_SECS" ]; then
    log "supervising: producer ${st:-RUNNING}, $(((now - start_ts) / 60))m elapsed (box quiet)"
    last_emit="$now"
  fi
  case "${st:-RUNNING}" in
  DONE) log "producer reported DONE — checkpoints are in R2" && break ;;
  FAILED) die "producer reported FAILED (see streamed log above)" ;;
  esac
  [[ "$newoff" =~ ^[0-9]+$ ]] && offset="$newoff"
  sleep 30
done

# Checkpoints are now in R2 and the box has nothing left to do — tear it down BEFORE the load so we
# stop paying for bare metal during the (much longer, destination-bound) restore.
log "checkpoints uploaded; tearing the box down before the load"
cleanup
trap - EXIT

if [ "$DO_LOAD" = "1" ]; then
  log "restoring checkpoints into the target on the runner (box already down)"
  CONFIGS="$CONFIGS" SHA="$SHA" VERSION="$VERSION" TARGET_URL="$TARGET_URL" \
    MODE="$MODE" TIMESTAMP="${TIMESTAMP:-}" \
    bash "$LIB_DIR/load-checkpoints.sh"
fi

log "checkpoint run complete."
