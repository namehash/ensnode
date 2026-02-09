#!/bin/bash

# Generate OpenAPI spec from ENSApi
# This script can be used both locally and in CI
#
# Usage:
#   ./generate_openapi_spec.sh           # Generate spec (default)
#   ./generate_openapi_spec.sh --check   # Generate and verify against committed version
#
# Environment variables:
#   ENSAPI_PORT        - Port for ENSApi (default: 4334)
#   STARTUP_TIMEOUT    - Seconds to wait for server startup (default: 30)
#   SKIP_VALIDATION    - Set to "true" to skip Mintlify validation (default: false)

set -e

# Configuration
ENSAPI_PORT="${ENSAPI_PORT:-4334}"
STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-30}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"
ENSAPI_URL="http://localhost:${ENSAPI_PORT}"

# Parse arguments
CHECK_MODE=false
for arg in "$@"; do
  case $arg in
    --check)
      CHECK_MODE=true
      shift
      ;;
  esac
done

# Detect repository root
if [ -n "$GITHUB_WORKSPACE" ]; then
  REPO_ROOT="$GITHUB_WORKSPACE"
else
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  REPO_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
fi

OPENAPI_JSON="$REPO_ROOT/docs/docs.ensnode.io/openapi.json"
ENSAPI_PID=""

# Cleanup function
cleanup() {
  if [ -n "$ENSAPI_PID" ]; then
    echo "Stopping ENSApi (PID: $ENSAPI_PID)..."
    kill "$ENSAPI_PID" 2>/dev/null || true
    wait "$ENSAPI_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting ENSApi in OpenAPI generate mode..."

# Start ENSApi in background
cd "$REPO_ROOT"
OPENAPI_GENERATE_MODE=true pnpm --filter ensapi start &
ENSAPI_PID=$!

# Wait for server to be ready
echo "Waiting for ENSApi to start (timeout: ${STARTUP_TIMEOUT}s)..."
SERVER_READY=false
for i in $(seq 1 "$STARTUP_TIMEOUT"); do
  if curl --fail --silent --max-time 5 "${ENSAPI_URL}/openapi.json" > /dev/null 2>&1; then
    echo "ENSApi is ready and responding"
    SERVER_READY=true
    break
  fi

  # Check if the process is still running
  if ! kill -0 "$ENSAPI_PID" 2>/dev/null; then
    echo "Error: ENSApi process exited unexpectedly"
    exit 1
  fi

  echo "Waiting for ENSApi to start... ($i/$STARTUP_TIMEOUT)"
  sleep 1
done

if [ "$SERVER_READY" != "true" ]; then
  echo "Error: ENSApi failed to start within ${STARTUP_TIMEOUT} seconds"
  exit 1
fi

# Generate the OpenAPI spec
echo "Generating OpenAPI spec..."
pnpm --filter @docs/mintlify openapi:generate "$ENSAPI_URL"

# Stop the server now that we have the spec
echo "Stopping ENSApi..."
kill "$ENSAPI_PID" 2>/dev/null || true
wait "$ENSAPI_PID" 2>/dev/null || true
ENSAPI_PID=""

# Check mode: verify spec matches committed version
if [ "$CHECK_MODE" = "true" ]; then
  echo "Verifying OpenAPI spec matches committed version..."
  if git diff --quiet "$OPENAPI_JSON"; then
    echo "OpenAPI spec is in sync with codebase"
  else
    echo "Error: OpenAPI spec is out of sync"
    echo ""
    echo "The committed openapi.json differs from what ENSApi generates:"
    echo ""
    git diff --color "$OPENAPI_JSON"
    echo ""
    echo "To fix, run: ./.github/scripts/generate_openapi_spec.sh"
    echo "Then commit the updated openapi.json."
    exit 1
  fi
fi

# Validate with Mintlify (unless skipped)
if [ "$SKIP_VALIDATION" != "true" ]; then
  echo "Validating OpenAPI spec with Mintlify..."
  pnpm dlx mintlify openapi-check "$OPENAPI_JSON"
fi

echo "Done!"
