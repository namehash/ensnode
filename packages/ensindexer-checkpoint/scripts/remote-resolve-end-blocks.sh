#!/usr/bin/env bash
# BOX: deterministically resolve per-chain end blocks for a target chain-time, using ONLY the
# ponder_sync cache (zero RPC). Prints `END_BLOCK_<chainId>=<block>` lines to stdout and writes a
# blocks manifest JSON to $MANIFEST_OUT. Used by the dev-checkpoint flow (END_BLOCK mode).
#
# For each chain, end block = the highest cached block whose timestamp <= $TIMESTAMP. The cache is
# sparse, so this lands on the nearest *cached* block; reproducible against a fixed seed.
#
# Env: TIMESTAMP (unix seconds, required), CHAIN_IDS (comma list, required), MANIFEST_OUT (required).
source "$(dirname "$0")/lib.sh"
require psql
require jq

: "${TIMESTAMP:?TIMESTAMP (unix seconds) required}"
: "${CHAIN_IDS:?CHAIN_IDS required (comma-separated)}"
: "${MANIFEST_OUT:?MANIFEST_OUT required}"

log "resolving per-chain end blocks for timestamp $TIMESTAMP from the ponder_sync cache"
chains_json="$(jq -n '{}')"
IFS=',' read -ra IDS <<<"$CHAIN_IDS"
for c in "${IDS[@]}"; do
  c="$(echo "$c" | tr -d '[:space:]')"
  [ -n "$c" ] || continue
  EB="$(pg -tAc "SELECT max(number) FROM ponder_sync.blocks WHERE chain_id=$c AND timestamp<=$TIMESTAMP" | tr -d '[:space:]')"
  [ -n "$EB" ] || die "cache does not cover chain $c up to timestamp $TIMESTAMP"
  echo "END_BLOCK_${c}=${EB}"
  chains_json="$(echo "$chains_json" | jq --arg c "$c" --argjson eb "$EB" '. + {($c): $eb}')"
done

jq -n --argjson ts "$TIMESTAMP" --argjson chains "$chains_json" \
  '{timestamp: $ts, end_blocks: $chains}' >"$MANIFEST_OUT"
log "wrote blocks manifest -> $MANIFEST_OUT"
