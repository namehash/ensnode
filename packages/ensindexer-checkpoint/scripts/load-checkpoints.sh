#!/usr/bin/env bash
# RUNNER (NOT the Cherry box): download the sha-keyed checkpoints from R2 and restore each into the
# target ENSDb as <config>Schema<VERSION>. Runs AFTER the Cherry box is torn down — the restore is
# bound by the destination Postgres (RAM), not by the box, so a multi-hour restore must not keep bare
# metal alive. Best run on a host adjacent to the target (e.g. the CI runner), not a laptop.
#
# Requires node + pnpm (to build ensdb-cli) + rclone, the repo checked out at $REPO_ROOT (deps already
# installed), and R2 credentials in the environment (same as the box flow).
#
# Env: CONFIGS (space-separated), SHA, VERSION, TARGET_URL, MODE (full-backfill|end-block),
#      TIMESTAMP (end-block only), REPO_ROOT (default: repo root), LOAD_WORKDIR (default: ./.ckpt-load).
source "$(dirname "$0")/lib.sh"
require node
require pnpm
require rclone

: "${CONFIGS:?}" "${SHA:?}" "${VERSION:?}" "${TARGET_URL:?}"
MODE="${MODE:-full-backfill}"
REPO_ROOT="${REPO_ROOT:-$(cd "$LIB_DIR/../../.." && pwd)}"
WORK="${LOAD_WORKDIR:-$PWD/.ckpt-load}"

read -ra CONFIG_LIST <<<"$CONFIGS"
[ "${#CONFIG_LIST[@]}" -gt 0 ] || die "CONFIGS is empty"

SUFFIX=""
[ "$MODE" = "end-block" ] && SUFFIX="-t${TIMESTAMP:?end-block mode requires TIMESTAMP}"
ckpt_name() { checkpoint_object "$1" "$SHA" "$SUFFIX"; }

# Local rclone config from the R2 credentials (kept out of the default config location).
RCLONE_TMP="$(mktemp)"
write_rclone_conf "$RCLONE_TMP"
export RCLONE_CONFIG="$RCLONE_TMP"
trap 'rm -f "$RCLONE_TMP"' EXIT

log "building ensdb-cli"
pnpm -C "$REPO_ROOT" -F @ensnode/ensdb-cli build >/dev/null
ensdb_cli() { node "$REPO_ROOT/packages/ensdb-cli/dist/cli.js" "$@"; }

mkdir -p "$WORK"
for c in "${CONFIG_LIST[@]}"; do
  cn="$(ckpt_name "$c")"
  ld="$WORK/$cn"
  log "[$c] downloading $cn (+ metadata) from R2"
  rclone copyto "$(r2_checkpoint "$cn")" "$ld"
  rclone copyto "$(r2_checkpoint "$cn.metadata.json")" "$ld.metadata.json"
  tgt="${c}Schema${VERSION}"
  log "[$c] restoring into target as $tgt"
  ensdb_cli load "$ld" --into "$TARGET_URL" --schema "$tgt"
  rm -f "$ld" "$ld.metadata.json" # free disk between configs (dumps are large)
done
rmdir "$WORK" 2>/dev/null || true

log "load complete: '$CONFIGS' -> <config>Schema${VERSION}"
echo "LOAD_DONE_OK"
