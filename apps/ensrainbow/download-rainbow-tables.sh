#!/bin/bash
set -euo pipefail

# Configuration
OUT_DIR="."
BASE_URL="https://bucket.ensrainbow.io"

# Check for DATA_VERSION environment variable and set file names accordingly
if [ "${DATA_VERSION:-}" = "v2" ]; then
    echo "Downloading v2 rainbow tables (DATA_VERSION=v2)..."
    DATA_FILE="ensrainbow_v2.sql.gz"
    CHECKSUM_FILE="ensrainbow_v2.sql.gz.sha256sum"
elif [ "${DATA_VERSION:-}" = "test" ]; then
    echo "Downloading test environment data (DATA_VERSION=test)..."
    DATA_FILE="ens_test_env_names.sql.gz"
    CHECKSUM_FILE="ens_test_env_names.sql.gz.sha256sum"
elif [ -z "${DATA_VERSION:-}" ] || [ "${DATA_VERSION:-}" = "v1" ]; then
    # Default to v1 if DATA_VERSION is not set or is empty
    echo "Downloading v1 rainbow tables (DATA_VERSION not set or empty)..."
    DATA_FILE="ens_names.sql.gz"
    CHECKSUM_FILE="ens_names.sql.gz.sha256sum"
else
    # Handle invalid DATA_VERSION values
    echo "Error: Invalid DATA_VERSION value '$DATA_VERSION'."
    echo "Allowed values are 'v2', 'test', 'v1' (default v1)."
    exit 1
fi

LICENSE_FILE="THE_GRAPH_LICENSE.txt"

TARGET_FILE="$OUT_DIR/ens_names.sql.gz"
TARGET_CHECKSUM_FILE="$OUT_DIR/ens_names.sql.gz.sha256sum"

# Create data directory if it doesn't exist
mkdir -p "$OUT_DIR"

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
download_with_progress "$BASE_URL/$LICENSE_FILE" "$OUT_DIR/$LICENSE_FILE" "license file"
download_with_progress "$BASE_URL/$DATA_FILE" "$TARGET_FILE" "ENS names database"

# Verify downloaded files
echo "Verifying downloaded files..."
cd "$OUT_DIR"
if sha256sum -c "ens_names.sql.gz.sha256sum"; then
    echo "✓ Download successful and verified!"
else
    echo "❌ Checksum verification failed after download"
    exit 1
fi
