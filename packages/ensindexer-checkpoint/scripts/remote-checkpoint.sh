#!/usr/bin/env bash
# BOX: the on-box orchestrator. Produce (or reuse) a sha-keyed checkpoint for a config, then
# optionally load it into a target ENSDb and refresh the R2 seed. Idempotent + R2-locked.
#
# Flow per (CONFIG, SHA[, CKPT_SUFFIX]):
#   - acquire R2 lock; on exit, release it
#   - if checkpoints/<CONFIG>-<SHA>[suffix].dump exists in R2 -> download it (skip indexing)
#     else -> remote-run.sh (index to is_ready) -> ensdb-cli dump -> upload dump+metadata to R2
#   - if DO_LOAD=1 -> ensdb-cli load into TARGET_URL as TARGET_SCHEMA (--skip-if-exists)
#   - if DO_SEED=1 -> remote-seed-export.sh (refresh canonical R2 seed)
#
# Env: MODE (full-backfill|end-block), CONFIG, SHA, SCHEMA (box-local), ALCHEMY_API_KEY,
#      DO_LOAD (0/1) [+ TARGET_URL, TARGET_SCHEMA], DO_SEED (0/1),
#      CKPT_SUFFIX (optional, e.g. -t<timestamp>), and for end-block mode: TIMESTAMP, CHAIN_IDS.
source "$(dirname "$0")/lib.sh"
require rclone
require pnpm
require node

: "${MODE:?}" "${CONFIG:?}" "${SHA:?}" "${SCHEMA:?}"
DO_LOAD="${DO_LOAD:-0}"
DO_SEED="${DO_SEED:-0}"
CKPT_SUFFIX="${CKPT_SUFFIX:-}"

LOCK_KEY="${CONFIG}-${SHA}${CKPT_SUFFIX}"
acquire_lock "$LOCK_KEY"
trap 'release_lock "$LOCK_KEY"' EXIT

CKPT_NAME="$(checkpoint_object "$CONFIG" "$SHA" "$CKPT_SUFFIX")"
META_NAME="${CKPT_NAME%.dump}.metadata.json"
LOCAL_DUMP="$DATA_MOUNT/${CKPT_NAME}"
LOCAL_META="$DATA_MOUNT/${META_NAME}"

ensdb_cli() {
  node "$REPO_DIR/packages/ensdb-cli/dist/cli.js" "$@"
}

if r2_exists "$(r2_checkpoint "$CKPT_NAME")"; then
  log "checkpoint $CKPT_NAME already in R2 — reusing (skipping index)"
  rclone copy "$(r2_checkpoint "$CKPT_NAME")" "$DATA_MOUNT/"
  rclone copy "$(r2_checkpoint "$META_NAME")" "$DATA_MOUNT/" 2>/dev/null || warn "no metadata object for $CKPT_NAME"
else
  log "no checkpoint in R2 — indexing $CONFIG @ $SHA (mode=$MODE)"
  MODE="$MODE" CONFIG="$CONFIG" SHA="$SHA" SCHEMA="$SCHEMA" \
    TIMESTAMP="${TIMESTAMP:-}" CHAIN_IDS="${CHAIN_IDS:-}" \
    bash "$LIB_DIR/remote-run.sh"

  log "building ensdb-cli"
  pnpm -C "$REPO_DIR" -F @ensnode/ensdb-cli build >/dev/null
  log "dumping schema $SCHEMA -> $LOCAL_DUMP (+ metadata)"
  ensdb_cli dump "$SCHEMA" --from "$ENSDB_URL" -f "$LOCAL_DUMP" --metadata-out "$LOCAL_META"

  log "uploading checkpoint + metadata to R2"
  rclone copyto "$LOCAL_DUMP" "$(r2_checkpoint "$CKPT_NAME")"
  rclone copyto "$LOCAL_META" "$(r2_checkpoint "$META_NAME")"
fi

if [ "$DO_LOAD" = "1" ]; then
  : "${TARGET_URL:?}" "${TARGET_SCHEMA:?}"
  [ -d "$REPO_DIR/packages/ensdb-cli/dist" ] || pnpm -C "$REPO_DIR" -F @ensnode/ensdb-cli build >/dev/null
  log "loading checkpoint into target as $TARGET_SCHEMA (--skip-if-exists)"
  meta_arg=()
  [ -f "$LOCAL_META" ] && meta_arg=(--metadata "$LOCAL_META")
  ensdb_cli load "$LOCAL_DUMP" --into "$TARGET_URL" --schema "$TARGET_SCHEMA" \
    "${meta_arg[@]}" --skip-if-exists
fi

if [ "$DO_SEED" = "1" ]; then
  log "refreshing canonical R2 seed from enriched ponder_sync"
  bash "$LIB_DIR/remote-seed-export.sh"
fi

log "remote-checkpoint complete: $CKPT_NAME"
echo "CHECKPOINT_DONE_OK $CKPT_NAME"
