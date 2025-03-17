#!/bin/bash
set -euo pipefail

# Configuration
DATA_DIR="."
BASE_URL="https://bucket.ensrainbow.io"

# Check for wrong number of arguments
if [ "$#" -gt 1 ]; then
    echo "Error: Too many arguments provided."
    echo "Usage: $0 [v2|test]"
    echo "If you want to download the v2 rainbow tables, use the 'v2' argument."
    echo "If you want to download the test environment data, use the 'test' argument."
    exit 1
fi

# Check for wrong value of the first argument
if [ "$#" -eq 1 ] && [ "$1" != "v2" ] && [ "$1" != "test" ]; then
    echo "Error: Invalid argument '$1'."
    echo "Usage: $0 [v2|test]"
    echo "If you want to download the v2 rainbow tables, use the 'v2' argument."
    echo "If you want to download the test environment data, use the 'test' argument."
    exit 1
fi

# Check for v2 argument
if [ "${1:-}" = "v2" ]; then
    echo "Downloading v2 rainbow tables..."
    DATA_FILE="ensrainbow_v2.sql.gz"
    CHECKSUM_FILE="ensrainbow_v2.sql.gz.sha256sum"
# Check for test environment argument
elif [ "${1:-}" = "test" ]; then
    echo "Downloading test environment data..."
    DATA_FILE="ens_test_env_names.sql.gz"
    CHECKSUM_FILE="ens_test_env_names.sql.gz.sha256sum"
else
    echo "Downloading v1 rainbow tables..."
    DATA_FILE="ens_names.sql.gz"
    CHECKSUM_FILE="ens_names.sql.gz.sha256sum"
fi

LICENSE_FILE="THE_GRAPH_LICENSE.txt"

TARGET_FILE="$DATA_DIR/ens_names.sql.gz"
TARGET_CHECKSUM_FILE="$DATA_DIR/ens_names.sql.gz.sha256sum"

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Function to show download progress
download_with_progress() {
    local url="$1"
    local output="$2"
    local description="$3"
    
    echo "Downloading $description..."
    wget -nv -O "$output" "$url"
}

# Download checksum of the chosen ENS names database
download_with_progress "$BASE_URL/$CHECKSUM_FILE" "$TARGET_CHECKSUM_FILE" "checksum file"

# Check if files exist and verify checksum
if [ -f "$TARGET_FILE" ] && [ -f "$TARGET_CHECKSUM_FILE" ]; then
    echo "Found existing files, verifying checksum..."
    if sha256sum -c "$TARGET_CHECKSUM_FILE" > /dev/null 2>&1; then
        echo "✓ Existing files are valid!"
        exit 0
    fi
    echo "⚠ Checksum verification failed, will download fresh files"
fi

# Download files
download_with_progress "$BASE_URL/$LICENSE_FILE" "$DATA_DIR/$LICENSE_FILE" "license file"
download_with_progress "$BASE_URL/$DATA_FILE" "$TARGET_FILE" "ENS names database"

# Verify downloaded files
echo "Verifying downloaded files..."
cd "$DATA_DIR"
if sha256sum -c "ens_names.sql.gz.sha256sum"; then
    echo "✓ Download successful and verified!"
else
    echo "❌ Checksum verification failed after download"
    exit 1
fi 
