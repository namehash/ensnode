#!/bin/bash

# Simple script to verify Ponder starts up correctly
# This script is used in CI and can be run locally

# Set default timeout if not provided by environment
: "${HEALTH_CHECK_TIMEOUT:=60}"  # Use env var if set, otherwise default to 60

# Detect if running from CI or local
if [ -n "$GITHUB_WORKSPACE" ]; then
  # Running in GitHub Actions
  ENSINDEXER_DIR="$GITHUB_WORKSPACE/apps/ensindexer"
else
  # Running locally - determine path relative to script location
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  REPO_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"  # Adjusted for .github/scripts path
  ENSINDEXER_DIR="$REPO_ROOT/apps/ensindexer"
fi

# Navigate to the ensindexer directory
cd "$ENSINDEXER_DIR" || {
  echo "Error: Could not navigate to $ENSINDEXER_DIR"
  exit 1
}

echo "Starting Ponder in the background from $(pwd)..."

# Create a temporary log file
LOG_FILE=$(mktemp)
echo "Logging output to $LOG_FILE"

# Create a temporary .env.local file for Ponder
ENV_FILE="$ENSINDEXER_DIR/.env.local"
echo "Creating temporary .env.local file at $ENV_FILE"
cat > "$ENV_FILE" << EOL
PORT=42069
# Add any other environment variables needed here
EOL

# Ensure the original script still has access to these variables
export PORT=42069

# Run the Ponder dev command in background and redirect output to log file
pnpm dev --disable-ui -vv > "$LOG_FILE" 2>&1 &
PID=$!

echo "Ponder started with PID: $PID"

# Wait for health check to pass
echo "Waiting for health check to pass (up to $HEALTH_CHECK_TIMEOUT seconds)..."
health_check_start=$(date +%s)
last_log_check=0

while true; do
  current_time=$(date +%s)
  
  # Periodically show log progress (every 15 seconds) to prevent CI timeout
  if [ $((current_time - last_log_check)) -ge 15 ]; then
    echo "Still waiting for health check at $(date) (elapsed: $((current_time - health_check_start)) seconds)..."
    echo "Recent log entries:"
    tail -n 10 "$LOG_FILE"
    last_log_check=$current_time
  fi
  
  # Check if the process is still running
  if ! ps -p $PID > /dev/null; then
    echo "Ponder process exited before health check passed"
    wait $PID
    EXIT_CODE=$?
    echo "Exit code: $EXIT_CODE"
    echo "Last 30 lines of log:"
    tail -n 30 "$LOG_FILE"
    rm -f "$LOG_FILE"
    # Clean up env file
    [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
    exit 1
  fi
  
  # Check for health ready message
  if grep -q "Started returning 200 responses from /health endpoint" "$LOG_FILE"; then
    echo "Health check passed! Ponder is up and running."
    echo "Test successful - terminating Ponder"
    # Force kill the Ponder process
    kill -9 $PID 2>/dev/null || true
    # Make sure we don't wait for the process to exit since we've force killed it
    wait $PID 2>/dev/null || true
    # Clean up the log file and env file
    rm -f "$LOG_FILE"
    [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
    # Explicitly exit with success code
    echo "Exiting with success code 0"
    exit 0
  fi
  
  # Check if we've reached the health check timeout
  elapsed=$((current_time - health_check_start))
  
  if [ $elapsed -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo "Health check timeout reached. Ponder did not become healthy."
    kill -9 $PID 2>/dev/null || true
    wait $PID 2>/dev/null || true
    echo "Last 30 lines of log:"
    tail -n 30 "$LOG_FILE"
    rm -f "$LOG_FILE"
    # Clean up env file
    [ -f "$ENV_FILE" ] && rm -f "$ENV_FILE"
    exit 1
  fi
  
  # Wait a bit before checking again
  sleep 2
done
