#!/usr/bin/env bash
# BOX: single-config convenience wrapper — checkout + rehydrate + index ONE config to completion. Used
# by the dev checkpoint flow (remote-checkpoint.sh). The production flow indexes BOTH configs in
# parallel on one box via remote-checkpoint-prod.sh, which calls remote-index-one.sh directly with
# per-config ports.
#
# Env: MODE, CONFIG, SHA, SCHEMA, ALCHEMY_API_KEY, and for end-block mode: TIMESTAMP, CHAIN_IDS.
source "$(dirname "$0")/lib.sh"

: "${MODE:?}" "${CONFIG:?}" "${SHA:?}" "${SCHEMA:?}"

log "checkout + rehydrate (single-config run: $CONFIG @ $SHA)"
SHA="$SHA" bash "$LIB_DIR/remote-checkout.sh"
bash "$LIB_DIR/remote-rehydrate.sh"

CONFIG="$CONFIG" SHA="$SHA" SCHEMA="$SCHEMA" MODE="$MODE" \
  INDEXER_PORT="${INDEXER_PORT:-42069}" \
  RAINBOW_PORT="${ENSRAINBOW_PORT:-3223}" \
  RAINBOW_DATA_DIR="${ENSRAINBOW_DATA_DIR:-$DATA_MOUNT/ensrainbow}" \
  ALCHEMY_API_KEY="${ALCHEMY_API_KEY:-}" \
  TIMESTAMP="${TIMESTAMP:-}" CHAIN_IDS="${CHAIN_IDS:-}" \
  bash "$LIB_DIR/remote-index-one.sh"
