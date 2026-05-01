#!/usr/bin/env bash
set -euo pipefail

SEED_SENTINEL_PATH="${SEED_SENTINEL_PATH:-/tmp/ens-test-kit-seeded}"
DEVNET_RPC_URL="${DEVNET_RPC_URL:-http://localhost:8545}"

rm -f "$SEED_SENTINEL_PATH"

bun ./script/runDevnet.ts --testNames &
DEVNET_PID=$!

cleanup() {
  if kill -0 "$DEVNET_PID" 2>/dev/null; then
    kill "$DEVNET_PID" || true
  fi
}

trap cleanup INT TERM

echo "[entrypoint] Waiting for Anvil JSON-RPC at ${DEVNET_RPC_URL}..."
ANVIL_READY=0
for _ in $(seq 1 120); do
  if curl -s -X POST "$DEVNET_RPC_URL" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    >/dev/null; then
    ANVIL_READY=1
    break
  fi
  sleep 1
done

if [[ "$ANVIL_READY" -ne 1 ]]; then
  echo "[entrypoint] Anvil did not become ready in time" >&2
  exit 1
fi

echo "[entrypoint] Waiting for contracts-v2 health endpoint..."
DEVNET_HEALTHY=0
for _ in $(seq 1 120); do
  if curl --fail -s http://localhost:8000/health >/dev/null; then
    DEVNET_HEALTHY=1
    break
  fi
  sleep 1
done

if [[ "$DEVNET_HEALTHY" -ne 1 ]]; then
  echo "[entrypoint] contracts-v2 health endpoint did not become ready in time" >&2
  exit 1
fi

echo "[entrypoint] Seeding devnet..."
bun /workspace/packages/ens-test-kit/bin/ens-test-kit.mjs seed --rpc "$DEVNET_RPC_URL" --fixtures canonical
touch "$SEED_SENTINEL_PATH"
echo "[entrypoint] Devnet seeded"

wait "$DEVNET_PID"
