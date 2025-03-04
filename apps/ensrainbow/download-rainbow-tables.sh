#!/bin/bash
set -euo pipefail

# Configuration
DATA_DIR="."
BASE_URL="https://bucket.ensrainbow.io"
DATA_FILE="ens_names.sql.gz"
CHECKSUM_FILE="ens_names.sql.gz.sha256sum"
LICENSE_FILE="THE_GRAPH_LICENSE.txt"

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

# Check if files exist and verify checksum
if [ -f "$DATA_DIR/$DATA_FILE" ] && [ -f "$DATA_DIR/$CHECKSUM_FILE" ]; then
    echo "Found existing files, verifying checksum..."
    if sha256sum -c "$DATA_DIR/$CHECKSUM_FILE" > /dev/null 2>&1; then
        echo "✓ Existing files are valid!"
        exit 0
    fi
    echo "⚠ Checksum verification failed, will download fresh files"
fi

# Download files
download_with_progress "$BASE_URL/$CHECKSUM_FILE" "$DATA_DIR/$CHECKSUM_FILE" "checksum file"
download_with_progress "$BASE_URL/$LICENSE_FILE" "$DATA_DIR/$LICENSE_FILE" "license file"
download_with_progress "$BASE_URL/$DATA_FILE" "$DATA_DIR/$DATA_FILE" "ENS names database"

# Verify downloaded files
echo "Verifying downloaded files..."
cd "$DATA_DIR"
if sha256sum -c "$CHECKSUM_FILE"; then
    echo "✓ Download successful and verified!"
else
    echo "❌ Checksum verification failed after download"
    exit 1
fi 
