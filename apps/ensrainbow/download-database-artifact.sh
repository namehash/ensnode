#!/bin/bash
set -euo pipefail

# This script downloads a specific ENS database artifact (.tgz), its checksum,
# and a license file. It requires SCHEMA_VERSION, NAMESPACE, and LABEL_SET as
# command-line arguments.

# Usage function
usage() {
    echo "Usage: $0 <SCHEMA_VERSION> <NAMESPACE> <LABEL_SET>"
    echo "Example: $0 v1 eth mainnet"
    exit 1
}

# Check for required arguments
if [ "$#" -ne 3 ]; then
    usage
fi

SCHEMA_VERSION="$1"
NAMESPACE="$2"
LABEL_SET="$3"

# Configuration
OUT_DIR="${OUT_DIR:-.}" # Default output directory, can be overridden e.g., OUT_DIR="data" ./script.sh ...
BASE_URL="https://bucket.ensrainbow.io"

# Construct file names and paths based on arguments
DATA_FILE_BASENAME="${NAMESPACE}_${LABEL_SET}.tgz"
SERVER_DATA_PATH="databases/${SCHEMA_VERSION}/${DATA_FILE_BASENAME}"
SERVER_CHECKSUM_PATH="databases/${SCHEMA_VERSION}/${DATA_FILE_BASENAME}.sha256sum"
SERVER_LICENSE_PATH="THE_GRAPH_LICENSE.txt" # Common license file

echo "ENS Database Artifact Download Script"
echo "-------------------------------------"
echo "Schema Version: $SCHEMA_VERSION"
echo "Namespace: $NAMESPACE"
echo "Label Set: $LABEL_SET"
echo "Output directory: $OUT_DIR"
echo "Base URL: $BASE_URL"
echo ""

# Derived local target paths
LOCAL_ARTIFACT_DIR_PATH="$OUT_DIR/databases/${SCHEMA_VERSION}"
TARGET_DATA_FILE_PATH="${LOCAL_ARTIFACT_DIR_PATH}/${DATA_FILE_BASENAME}"
TARGET_CHECKSUM_FILE_PATH="${LOCAL_ARTIFACT_DIR_PATH}/${DATA_FILE_BASENAME}.sha256sum"
TARGET_LICENSE_FILE_PATH="$OUT_DIR/${SERVER_LICENSE_PATH}" # License in base OUT_DIR

# Create data directories if they don't exist
mkdir -p "$LOCAL_ARTIFACT_DIR_PATH" # This will also create $OUT_DIR and $OUT_DIR/databases if they don't exist
# If OUT_DIR is just ".", license will be in current dir, which is fine.
# If OUT_DIR is "data", license will be in "data/THE_GRAPH_LICENSE.txt". mkdir -p on LOCAL_ARTIFACT_DIR_PATH handles "data/"

# Function to download files with progress
download_with_progress() {
    local url="$1"
    local output_path="$2"
    local description="$3"

    echo "Downloading $description..."
    echo "Source URL: $url"
    echo "Destination: $output_path"

    if wget --progress=dot:giga -O "$output_path" "$url"; then
        echo "Successfully downloaded $description."
        echo ""
    else
        echo "ERROR: Failed to download $description from $url."
        rm -f "$output_path" # Clean up partially downloaded file
        exit 1
    fi
}

# Function to verify checksum
# Assumes checksum file and the data file it refers to are in the same directory ($LOCAL_ARTIFACT_DIR_PATH)
verify_checksum() {
    local checksum_file_basename
    checksum_file_basename=$(basename "$TARGET_CHECKSUM_FILE_PATH")
    echo "Verifying checksum using $checksum_file_basename in $LOCAL_ARTIFACT_DIR_PATH..."
    if (cd "$LOCAL_ARTIFACT_DIR_PATH" && sha256sum --status -c "$checksum_file_basename"); then
        return 0 # Success
    else
        return 1 # Failure
    fi
}

# 1. Download checksum file first
download_with_progress "$BASE_URL/$SERVER_CHECKSUM_PATH" "$TARGET_CHECKSUM_FILE_PATH" "Checksum file ($DATA_FILE_BASENAME.sha256sum)"

# 2. Check if data file already exists and is valid
if [ -f "$TARGET_DATA_FILE_PATH" ]; then
    echo "Data file ($TARGET_DATA_FILE_PATH) already exists."
    if verify_checksum; then
        echo "✓ Checksum VERIFIED for existing data file ($DATA_FILE_BASENAME)."

        # Optionally, ensure license file is also present
        if [ ! -f "$TARGET_LICENSE_FILE_PATH" ]; then
            echo "License file ($TARGET_LICENSE_FILE_PATH) is missing. Downloading it..."
            download_with_progress "$BASE_URL/$SERVER_LICENSE_PATH" "$TARGET_LICENSE_FILE_PATH" "License file ($SERVER_LICENSE_PATH)"
        else
            echo "License file ($TARGET_LICENSE_FILE_PATH) already exists."
        fi

        echo "All required files are present and valid."
        echo "  Data:     $TARGET_DATA_FILE_PATH"
        echo "  Checksum: $TARGET_CHECKSUM_FILE_PATH"
        echo "  License:  $TARGET_LICENSE_FILE_PATH"
        exit 0
    else
        echo "⚠ Checksum FAILED for existing data file ($DATA_FILE_BASENAME)."
        echo "Will proceed to download a fresh copy of the data file."
        rm -f "$TARGET_DATA_FILE_PATH" # Remove potentially corrupted existing file
    fi
else
    echo "Data file ($TARGET_DATA_FILE_PATH) not found. Proceeding with download."
    echo ""
fi

# 3. Download License File (if not already downloaded and exited above)
# This check ensures we don't re-download if it was fetched during the "existing valid data" check.
if [ ! -f "$TARGET_LICENSE_FILE_PATH" ]; then
    download_with_progress "$BASE_URL/$SERVER_LICENSE_PATH" "$TARGET_LICENSE_FILE_PATH" "License file ($SERVER_LICENSE_PATH)"
else
    # This case is mostly for when data file was missing, but license might have been there from a previous partial run.
    echo "License file ($TARGET_LICENSE_FILE_PATH) already present."
    echo ""
fi

# 4. Download Data File (if not already present and valid)
download_with_progress "$BASE_URL/$SERVER_DATA_PATH" "$TARGET_DATA_FILE_PATH" "Database artifact ($DATA_FILE_BASENAME)"

# 5. Verify downloaded data file
echo "Verifying checksum of newly downloaded data file ($DATA_FILE_BASENAME)..."
if verify_checksum; then
    echo "✓ Download successful and checksum VERIFIED for $DATA_FILE_BASENAME!"
else
    echo "❌ CRITICAL ERROR: Checksum FAILED after download for $DATA_FILE_BASENAME using $(basename "$TARGET_CHECKSUM_FILE_PATH")."
    echo "The downloaded data file may be corrupted or incomplete."
    # Consider cleaning up $TARGET_DATA_FILE_PATH here as well
    exit 1
fi

echo ""
echo "---------------------------------------------------"
echo "ENS Database Artifact download and verification complete."
echo "Schema: $SCHEMA_VERSION, Namespace: $NAMESPACE, Label Set: $LABEL_SET"
echo "Files are located in respective subdirectories of: $OUT_DIR"
echo "  - Data:     $TARGET_DATA_FILE_PATH"
echo "  - Checksum: $TARGET_CHECKSUM_FILE_PATH"
echo "  - License:  $TARGET_LICENSE_FILE_PATH"
echo "---------------------------------------------------"

exit 0 
