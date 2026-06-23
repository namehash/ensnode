#!/usr/bin/env bash
# The unified manual runner (the GitHub workflows orchestrate the same steps inline). Brings ONE Cherry
# box up, ships scripts + configs + an rclone.conf, provisions it, runs remote-checkpoint.sh, and tears
# the box down. Covers both flows via CONFIGS/MODE/DO_LOAD/DO_SEED:
#   production:  CONFIGS="alpha mainnet" SHA=<sha> VERSION=<v> MODE=full-backfill DO_LOAD=1 TARGET_URL=<url> DO_SEED=1
#   dev:         CONFIGS="<config>"      SHA=<sha>             MODE=end-block TIMESTAMP=<unix>
#
# Env:
#   CONFIGS       space-separated configs to index            (required)
#   SHA           commit to index                             (required)
#   MODE          full-backfill|end-block (default full-backfill)
#   TIMESTAMP     unix seconds (end-block mode only)
#   VERSION       release version for target schema names     (required when DO_LOAD=1)
#   DO_LOAD=1 + TARGET_URL                                    load checkpoints into a target ENSDb
#   DO_SEED=1                                                 refresh the canonical R2 seed
#   KEEP_BOX=1                                                leave the box up afterwards (debugging)
source "$(dirname "$0")/lib.sh"

: "${CONFIGS:?}" "${SHA:?}"
MODE="${MODE:-full-backfill}"
REMOTE_DIR="checkpoint-scripts"

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

# Ship run params + secrets (notably TARGET_URL) via a 600 file, NOT as SSH-command argv — argv is
# readable in the box's process table. remote-checkpoint.sh is invoked after sourcing it.
ENV_TMP="$(mktemp)"
write_env_file "$ENV_TMP" CONFIGS SHA MODE TIMESTAMP VERSION DO_LOAD DO_SEED TARGET_URL ALCHEMY_API_KEY
scp_to_box "$ENV_TMP" "$REMOTE_DIR/.run-env"
rm -f "$ENV_TMP"
on_box "chmod 600 ~/$REMOTE_DIR/.run-env"

if on_box "command -v pnpm >/dev/null 2>&1"; then
  log "toolchain present"
else
  log "provisioning toolchain"
  on_box "cd ~/$REMOTE_DIR && bash remote-provision.sh"
fi

log "running remote-checkpoint.sh on the box (the long part)"
on_box "cd ~/$REMOTE_DIR && set -a && . ./.run-env && set +a && bash remote-checkpoint.sh; rc=\$?; rm -f ./.run-env; exit \$rc"

log "checkpoint run complete."
