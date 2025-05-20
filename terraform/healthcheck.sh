#!/bin/bash

# Health Check Script
#
# This script performs an HTTP health check on a given URL by repeatedly sending
# requests and verifying the expected HTTP status code. 
# The script retries the request multiple times with a delay between
# attempts and supports configurable timeout, expected status code, and retry logic.
#
# Usage: ./health_check.sh <url>
#
# Environment Variables:
#   TIMEOUT          - Maximum time in seconds to wait for a response (default: 30)
#   EXPECTED_STATUS  - HTTP status code expected from the URL (default: 200)
#   RETRY_ATTEMPTS   - Number of retry attempts before failing (default: 30)
#   RETRY_DELAY      - Delay in seconds between retries (default: 10)

# Get URL from command line argument or exit
URL=$1
if [ -z "$URL" ]; then
  echo "Error: URL not provided"
  echo "Usage: $0 <url>"
  exit 1
fi

# Default values
TIMEOUT=${TIMEOUT:-30}
EXPECTED_STATUS=${EXPECTED_STATUS:-200}
RETRY_ATTEMPTS=${RETRY_ATTEMPTS:-30}
RETRY_DELAY=${RETRY_DELAY:-10}

echo "Checking health of: $URL"
echo "Timeout: $TIMEOUT seconds"
echo "Expected status: $EXPECTED_STATUS"
echo "Retry attempts: $RETRY_ATTEMPTS"

perform_check() {
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $URL)
  
  echo "Received status code: $STATUS"
  
  if [ "$STATUS" = "$EXPECTED_STATUS" ]; then
    echo "Health check PASSED for $URL"
    return 0
  else
    echo "Health check FAILED for $URL (Expected: $EXPECTED_STATUS, Got: $STATUS)"
    return 1
  fi
}

i=1
while [ $i -le $RETRY_ATTEMPTS ]; do
  echo "Attempt $i of $RETRY_ATTEMPTS"
  
  if perform_check; then
    exit 0
  fi
  
  if [ $i -lt $RETRY_ATTEMPTS ]; then
    echo "Waiting $RETRY_DELAY seconds before retrying..."
    sleep $RETRY_DELAY
  fi
  
  i=$((i + 1))
done

echo "All health check attempts failed for $URL"
exit 1
