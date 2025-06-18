#!/bin/bash
set -euo pipefail

# This script downloads a specific ENS Rainbow labelset, its checksum, and license file.
# It requires NAMESPACE and LABEL_SET as command-line arguments.

# Usage function
usage() {
    echo "Usage: $0 <NAMESPACE> <LABEL_SET>"
    echo "Example: $0 eth mainnet"
    exit 1
}

# Check for required arguments
if [ "$#" -ne 2 ]; then
    usage
fi

NAMESPACE="$1"
LABEL_SET="$2"

# Configuration
OUT_DIR="${OUT_DIR:-.}" # Default output directory, can be overridden e.g., OUT_DIR="data" ./script.sh <namespace> <label_set>
BASE_URL="https://bucket.ensrainbow.io"

# Construct file names based on arguments
DATA_FILE_BASENAME="${NAMESPACE}_${LABEL_SET}.ensrainbow"
SERVER_DATA_PATH="labelsets/${DATA_FILE_BASENAME}"
SERVER_CHECKSUM_PATH="labelsets/${DATA_FILE_BASENAME}.sha256sum"
SERVER_LICENSE_PATH="THE_GRAPH_LICENSE.txt" # Common license file

echo "ENS Rainbow Labelset Download Script"
echo "------------------------------------"
echo "Namespace: $NAMESPACE"
echo "Label Set: $LABEL_SET"
echo "Output directory: $OUT_DIR"
echo "Base URL: $BASE_URL"
echo ""

# Derived local target paths
LOCAL_LABELSET_DIR="$OUT_DIR/labelsets"
TARGET_DATA_FILE_PATH="${LOCAL_LABELSET_DIR}/${DATA_FILE_BASENAME}"
TARGET_CHECKSUM_FILE_PATH="${LOCAL_LABELSET_DIR}/${DATA_FILE_BASENAME}.sha256sum"
TARGET_LICENSE_FILE_PATH="$OUT_DIR/${SERVER_LICENSE_PATH}"

# Create data directories if they don't exist
mkdir -p "$OUT_DIR" # For license file and as parent for labelset_dir
mkdir -p "$LOCAL_LABELSET_DIR" # For data and checksum files

# Function to download files with progress
download_with_progress() {
    local url="$1"
    local output_path="$2"
    local description="$3"

    echo "Downloading $description..."
    echo "Source URL: $url"
    echo "Destination: $output_path"
    
    # wget options:
    # -nv: non-verbose (quiet but not silent, shows errors and basic progress)
    # -O: output to specified file
    # Consider adding --show-progress for newer wget versions if -nv is too quiet
    if wget -nv -O "$output_path" "$url"; then
        echo "Successfully downloaded $description."
        echo ""
    else
        echo "ERROR: Failed to download $description from $url."
        # Clean up partially downloaded file
        rm -f "$output_path"
        exit 1 # Exit due to download failure (set -e also handles this)
    fi
}

# 1. Download checksum file first
download_with_progress "$BASE_URL/$SERVER_CHECKSUM_PATH" "$TARGET_CHECKSUM_FILE_PATH" "Checksum file ($DATA_FILE_BASENAME.sha256sum)"

# Function to verify checksum
# Assumes checksum file is in $LOCAL_LABELSET_DIR and contains basename of data file
verify_checksum() {
    local checksum_file_basename
    checksum_file_basename=$(basename "$TARGET_CHECKSUM_FILE_PATH")
    echo "Verifying checksum using $checksum_file_basename in $LOCAL_LABELSET_DIR..."
    if (cd "$LOCAL_LABELSET_DIR" && sha256sum --status -c "$checksum_file_basename"); then
        return 0 # Success
    else
        return 1 # Failure
    fi
}

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
        echo "Data: $TARGET_DATA_FILE_PATH"
        echo "Checksum: $TARGET_CHECKSUM_FILE_PATH"
        echo "License: $TARGET_LICENSE_FILE_PATH"
        exit 0
    else
        echo "⚠ Checksum FAILED for existing data file ($DATA_FILE_BASENAME)."
        echo "Will proceed to download a fresh copy of the data file and license."
        # Remove potentially corrupted existing file before re-downloading
        rm -f "$TARGET_DATA_FILE_PATH"
    fi
else
    echo "Data file ($TARGET_DATA_FILE_PATH) not found. Proceeding with download."
    echo ""
fi

# 3. Download License File
# (If not already downloaded and exited above)
if [ ! -f "$TARGET_LICENSE_FILE_PATH" ]; then # Check again in case it was downloaded with valid data
    download_with_progress "$BASE_URL/$SERVER_LICENSE_PATH" "$TARGET_LICENSE_FILE_PATH" "License file ($SERVER_LICENSE_PATH)"
else
    echo "License file ($TARGET_LICENSE_FILE_PATH) already present (or downloaded with prior valid data check)."
    echo ""
fi

# 4. Download Data File
# (If not already present and valid)
download_with_progress "$BASE_URL/$SERVER_DATA_PATH" "$TARGET_DATA_FILE_PATH" "ENS Rainbow labelset ($DATA_FILE_BASENAME)"

# 5. Verify downloaded data file
echo "Verifying checksum of downloaded data file ($DATA_FILE_BASENAME)..."
if verify_checksum; then
    echo "✓ Download successful and checksum VERIFIED for $DATA_FILE_BASENAME!"
else
    echo "❌ CRITICAL ERROR: Checksum FAILED after download for $DATA_FILE_BASENAME using $(basename "$TARGET_CHECKSUM_FILE_PATH")."
    echo "The downloaded data file may be corrupted or incomplete."
    exit 1
fi

echo ""
echo "------------------------------------------"
echo "ENS Rainbow labelset download and verification complete."
echo "Namespace: $NAMESPACE, Label Set: $LABEL_SET"
echo "Files are located in respective subdirectories of: $OUT_DIR"
echo "  - Data:     $TARGET_DATA_FILE_PATH"
echo "  - Checksum: $TARGET_CHECKSUM_FILE_PATH"
echo "  - License:  $TARGET_LICENSE_FILE_PATH"
echo "------------------------------------------"

exit 0 
