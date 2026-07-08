#!/usr/bin/env bash
# Mine a CREATE2 salt for the ENSNameHealer proxy using Foundry's `cast create2`.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  source .env
fi

: "${OWNER_ADDRESS:?Set OWNER_ADDRESS in .env}"
: "${CREATE2_PREFIX:=1abe15}"

forge script script/ComputeCreate2.s.sol -q

INIT_CODE=$(tr -d '[:space:]' <cache/create2-proxy-init-code.hex)

echo "Mining CREATE2 salt for prefix: ${CREATE2_PREFIX}"
OUTPUT=$(cast create2 --starts-with "${CREATE2_PREFIX}" --init-code "${INIT_CODE}")

SALT=$(echo "${OUTPUT}" | awk '/^Salt:/{print $2}')
ADDRESS=$(echo "${OUTPUT}" | awk '/^Address:/{print $2}')

echo ""
echo "CREATE2_SALT=${SALT}"
echo "Predicted proxy: ${ADDRESS}"
echo ""
echo "Add to .env:"
echo "export CREATE2_SALT=${SALT}"
echo "export CREATE2_PREFIX=${CREATE2_PREFIX}"
