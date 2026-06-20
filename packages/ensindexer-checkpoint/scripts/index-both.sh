#!/usr/bin/env bash
# Manual production runner: bring ONE Cherry box up, ship scripts + configs + rclone.conf, provision
# it, index BOTH mainnet-namespace configs (alpha + mainnet) in parallel via remote-checkpoint-prod.sh,
# optionally load them into a target ENSDb, refresh the R2 seed, then tear the box down. The GitHub
# workflow orchestrates the same steps inline.
#
# Env:
#   SHA           commit to index                          (required)
#   VERSION       release version for target schema names  (required)
#   DO_LOAD=1 + TARGET_URL                                 load both checkpoints into a target ENSDb
#   DO_SEED=1                                              refresh the canonical R2 seed (default on)
#   KEEP_BOX=1                                             leave the box up afterwards (debugging)
source "$(dirname "$0")/lib.sh"

: "${SHA:?}" "${VERSION:?}"
DO_SEED="${DO_SEED:-1}"
REMOTE_DIR="checkpoint-scripts"

cleanup() { [ "${KEEP_BOX:-0}" = "1" ] || bash "$LIB_DIR/cherry-down.sh"; }

log "production index run: sha=$SHA version=$VERSION (configs: alpha + mainnet, parallel, one box)"
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

log "running remote-checkpoint-prod.sh on the box (the long part)"
on_box "cd ~/$REMOTE_DIR && \
  SHA='$SHA' VERSION='$VERSION' \
  ALCHEMY_API_KEY='${ALCHEMY_API_KEY:-}' \
  DO_LOAD='${DO_LOAD:-0}' TARGET_URL='${TARGET_URL:-}' \
  DO_SEED='$DO_SEED' \
  bash remote-checkpoint-prod.sh"

log "production index run complete."
