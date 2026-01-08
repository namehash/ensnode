#!/bin/bash

# Simple script to verify ENSIndexer starts up correctly
# This script is used in CI and can be run locally

# Set default timeout if not provided by environment
# Use env var if set, otherwise default to 60 seconds
: "${HEALTH_CHECK_TIMEOUT:=60}"

# Detect if running from CI or local
if [ -n "$GITHUB_WORKSPACE" ]; then
  # Running in GitHub Actions
  ENSINDEXER_DIR="$GITHUB_WORKSPACE/apps/ensindexer"
else
  # Running locally - determine path relative to script location
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  # Adjusted for .github/scripts path
  REPO_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
  ENSINDEXER_DIR="$REPO_ROOT/apps/ensindexer"
fi

# Navigate to the ensindexer directory
cd "$ENSINDEXER_DIR" || {
  echo "Error: Could not navigate to $ENSINDEXER_DIR"
  exit 1
}

echo "Starting ENSIndexer in the background from $(pwd)..."

# Create a temporary log file
LOG_FILE=$(mktemp)
echo "Logging output to $LOG_FILE"

# Run ENSIndexer using the Ponder dev command in background
# and redirect output to log file
pnpm dev --disable-ui -vv > "$LOG_FILE" 2>&1 &
PID=$!

echo "ENSIndexer started with PID: $PID"

# Require ENSINDEXER_URL to be set
if [ -z "$ENSINDEXER_URL" ]; then
  echo "Error: ENSINDEXER_URL environment variable must be set"
  kill -9 $PID 2>/dev/null || true
  wait $PID 2>/dev/null || true
  rm -f "$LOG_FILE"
  [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
  exit 1
fi

# Wait for health check to pass
echo "Waiting for health check to pass at ${ENSINDEXER_URL}/health (up to $HEALTH_CHECK_TIMEOUT seconds)..."
health_check_start=$(date +%s)
last_log_check=0

while true; do
  current_time=$(date +%s)

  # Periodically show progress (every 15 seconds) to prevent CI timeout
  if [ $((current_time - last_log_check)) -ge 15 ]; then
    echo "Still waiting for health check at $(date) (elapsed: $((current_time - health_check_start)) seconds)..."
    last_log_check=$current_time
  fi

  # Check if the process is still running
  if ! ps -p $PID > /dev/null; then
    echo "ENSIndexer process exited before health check passed"
    wait $PID
    EXIT_CODE=$?
    echo "Exit code: $EXIT_CODE"
    echo "Last 30 lines of log:"
    tail -n 30 "$LOG_FILE"
    rm -f "$LOG_FILE"
    [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
    exit 1
  fi

  # Check health endpoint
  if curl -sf "${ENSINDEXER_URL}/health" >/dev/null 2>&1; then
    echo "Health check passed! ENSIndexer is up and running."
    echo "Test successful - terminating ENSIndexer"
    # Force kill the ENSIndexer process
    kill -9 $PID 2>/dev/null || true
    wait $PID 2>/dev/null || true
    # Clean up the log file and env file
    rm -f "$LOG_FILE"
    [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
    echo "Exiting with success code 0"
    exit 0
  fi

  # Check if we've reached the health check timeout
  elapsed=$((current_time - health_check_start))
  if [ $elapsed -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo "Health check timeout reached. ENSIndexer did not become healthy."
    kill -9 $PID 2>/dev/null || true
    wait $PID 2>/dev/null || true
    echo "Last 30 lines of log:"
    tail -n 30 "$LOG_FILE"
    rm -f "$LOG_FILE"
    [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
    exit 1
  fi

  # Wait a bit before checking again
  sleep 2
done
