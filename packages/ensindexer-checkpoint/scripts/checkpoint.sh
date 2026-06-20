#!/usr/bin/env bash
# Manual end-to-end runner (the GitHub workflows orchestrate the same steps inline). Brings a Cherry
# box up, ships the scripts + an rclone.conf, provisions it, runs remote-checkpoint.sh, and tears the
# box down. Idempotent + R2-locked via remote-checkpoint.sh.
#
# Env:
#   CONFIG        alpha|mainnet|…             (required)
#   SHA           commit to index             (required)
#   MODE          full-backfill|end-block     (default full-backfill)
#   DO_LOAD=1 + TARGET_URL + TARGET_SCHEMA     load the checkpoint into a target ENSDb
#   DO_SEED=1                                  refresh the canonical R2 seed (alpha only)
#   TIMESTAMP + CHAIN_IDS [+ CKPT_SUFFIX]      end-block mode (dev checkpoints)
#   KEEP_BOX=1                                 leave the box up afterwards (debugging)
source "$(dirname "$0")/lib.sh"

: "${CONFIG:?}" "${SHA:?}"
MODE="${MODE:-full-backfill}"
SCHEMA="ckpt_${CONFIG}_${SHA}"
REMOTE_DIR="checkpoint-scripts"

cleanup() { [ "${KEEP_BOX:-0}" = "1" ] || bash "$LIB_DIR/cherry-down.sh"; }

log "checkpoint run: config=$CONFIG sha=$SHA mode=$MODE schema=$SCHEMA"
bash "$LIB_DIR/cherry-up.sh"
trap cleanup EXIT

log "shipping scripts + configs + rclone.conf to the box"
on_box "mkdir -p ~/$REMOTE_DIR ~/$REMOTE_DIR/configs ~/.config/rclone"
scp_to_box "$LIB_DIR"/* "$REMOTE_DIR/"
# Ship the canonical config identity from this (orchestrating) checkout so the indexed commit need
# not contain configs/*.env. CONFIGS_SRC resolves repo-root/apps/ensindexer/configs.
CONFIGS_SRC="$LIB_DIR/../../../apps/ensindexer/configs"
scp_to_box "$CONFIGS_SRC"/*.env "$REMOTE_DIR/configs/"
RCLONE_TMP="$(mktemp)"
write_rclone_conf "$RCLONE_TMP"
scp_to_box "$RCLONE_TMP" ".config/rclone/rclone.conf"
rm -f "$RCLONE_TMP"

if on_box "command -v pnpm >/dev/null 2>&1"; then
  log "toolchain present"
else
  log "provisioning toolchain"
  on_box "cd ~/$REMOTE_DIR && bash remote-provision.sh"
fi

log "running remote-checkpoint.sh on the box (the long part)"
on_box "cd ~/$REMOTE_DIR && \
  MODE='$MODE' CONFIG='$CONFIG' SHA='$SHA' SCHEMA='$SCHEMA' \
  ALCHEMY_API_KEY='${ALCHEMY_API_KEY:-}' \
  DO_LOAD='${DO_LOAD:-0}' TARGET_URL='${TARGET_URL:-}' TARGET_SCHEMA='${TARGET_SCHEMA:-}' \
  DO_SEED='${DO_SEED:-0}' \
  TIMESTAMP='${TIMESTAMP:-}' CHAIN_IDS='${CHAIN_IDS:-}' CKPT_SUFFIX='${CKPT_SUFFIX:-}' \
  bash remote-checkpoint.sh"

log "checkpoint run complete."
