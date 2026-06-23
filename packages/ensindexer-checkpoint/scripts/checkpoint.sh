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
[ "$DO_LOAD" = "1" ] && : "${VERSION:?DO_LOAD requires VERSION}" "${TARGET_URL:?DO_LOAD requires TARGET_URL}"

cleanup() { [ "${KEEP_BOX:-0}" = "1" ] || bash "$LIB_DIR/cherry-down.sh"; }

log "checkpoint run: configs='$CONFIGS' sha=$SHA mode=$MODE"
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

log "producing checkpoints on the box (the long part)"
on_box "cd ~/$REMOTE_DIR && set -a && . ./.run-env && set +a && bash remote-checkpoint.sh; rc=\$?; rm -f ./.run-env; exit \$rc"

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
