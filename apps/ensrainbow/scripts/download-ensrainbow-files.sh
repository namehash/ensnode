#!/bin/bash
set -euo pipefail

# ==============================================================================
# Download ENSRainbow Labelset File
#
# Goal & Motivation:
# This script downloads a specific ENSRainbow labelset file, which contains
# a set of ENS names for a particular purpose or from a specific source (e.g., 'ens-test-env', 'subgraph').
# These labelsets are used by the ENSRainbow application for populating its database and healing labelhashes.
#
# The labelsets are identified by:
#   - LABEL_SET_ID: The "namespace" or category of the data (e.g., 'ens-test-env').
#   - LABEL_SET_VERSION: An incremental version for a given label set.
#
# This script requires these two identifiers as command-line arguments to
# download the correct labelset file (.ensrainbow), its checksum, and a
# license file from a configured ENSRainbow Labelset Server.
# ==============================================================================

# --- Configuration ---

# The base URL of the ENSRainbow Labelset Server.
# This can be overridden by the `ENSRAINBOW_LABELSET_SERVER_URL` environment variable.
ENSRAINBOW_LABELSET_SERVER_URL="${ENSRAINBOW_LABELSET_SERVER_URL:-https://bucket.ensrainbow.io}"

# Usage function
usage() {
    echo "Usage: $0 <LABEL_SET_ID> <LABEL_SET_VERSION>"
    echo "Example: $0 eth mainnet"
    exit 1
}

# Check for required arguments
if [ "$#" -ne 2 ]; then
    usage
fi

LABEL_SET_ID="$1"
LABEL_SET_VERSION="$2"

# Configuration
OUT_DIR="${OUT_DIR:-.}" # Default output directory, can be overridden e.g., OUT_DIR="data" ./script.sh <label-set-id> <label-set-version>
BASE_URL="${ENSRAINBOW_LABELSET_SERVER_URL}"

# Construct file names based on arguments
DATA_FILE_BASENAME="${LABEL_SET_ID}_${LABEL_SET_VERSION}.ensrainbow"
SERVER_DATA_PATH="labelsets/${DATA_FILE_BASENAME}"
SERVER_CHECKSUM_PATH="labelsets/${DATA_FILE_BASENAME}.sha256sum"
SERVER_LICENSE_PATH="labelsets/${DATA_FILE_BASENAME}.LICENSE.txt" # Common license file

echo "Starting ENSRainbow labelset file download..."
echo "Output Directory: $OUT_DIR"
echo "Labelset Server URL: $BASE_URL"
echo "Label Set ID: $LABEL_SET_ID"
echo "Label Set Version: $LABEL_SET_VERSION"
echo ""

# Derived local target paths
LOCAL_LABELSET_DIR="$OUT_DIR/labelsets"
TARGET_DATA_FILE_PATH="${LOCAL_LABELSET_DIR}/${DATA_FILE_BASENAME}"
TARGET_CHECKSUM_FILE_PATH="${LOCAL_LABELSET_DIR}/${DATA_FILE_BASENAME}.sha256sum"
TARGET_LICENSE_FILE_PATH="${LOCAL_LABELSET_DIR}/${DATA_FILE_BASENAME}.LICENSE.txt"

# Create data directories if they don't exist
mkdir -p "$LOCAL_LABELSET_DIR" # This will also create $OUT_DIR if it doesn't exist

# Function to download files with progress
download_with_progress() {
    local url="$1"
    local output_path="$2"
    local description="$3"
    local is_optional="${4:-false}"

    local type_string="Downloading"
    if [ "$is_optional" = "true" ]; then
        type_string="Optionally downloading"
    fi

    echo "$type_string $description..."
    echo "Source URL: $url"
    echo "Destination: $output_path"

    if wget -nv -O "$output_path" "$url"; then
        echo "Successfully downloaded $description."
        echo ""
    else
        rm -f "$output_path" # Clean up partially downloaded file
        if [ "$is_optional" = "true" ]; then
            echo "WARNING: Failed to download optional $description from $url. Continuing without it."
            echo ""
        else
            echo "ERROR: Failed to download $description from $url."
            exit 1 # Exit due to download failure (set -e also handles this)
        fi
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
            download_with_progress "$BASE_URL/$SERVER_LICENSE_PATH" "$TARGET_LICENSE_FILE_PATH" "License file ($SERVER_LICENSE_PATH)" "true"
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
    download_with_progress "$BASE_URL/$SERVER_LICENSE_PATH" "$TARGET_LICENSE_FILE_PATH" "License file ($SERVER_LICENSE_PATH)" "true"
else
    echo "License file ($TARGET_LICENSE_FILE_PATH) already present (or downloaded with prior valid data check)."
    echo ""
fi

# 4. Download Data File
# (If not already present and valid)
download_with_progress "$BASE_URL/$SERVER_DATA_PATH" "$TARGET_DATA_FILE_PATH" "ENS Rainbow labelset ($DATA_FILE_BASENAME)"

# 5. Verify downloaded data file
echo "Verifying checksum of newly downloaded data file ($DATA_FILE_BASENAME)..."
if verify_checksum; then
    echo "✓ Download successful and checksum VERIFIED for $DATA_FILE_BASENAME!"
else
    echo "❌ CRITICAL ERROR: Checksum FAILED after download for $DATA_FILE_BASENAME using $(basename "$TARGET_CHECKSUM_FILE_PATH")."
    echo "The downloaded data file may be corrupted or incomplete."
    exit 1
fi

echo ""
echo "---------------------------------------------------"
echo "ENSRainbow labelset file download and checksum verification complete."
echo "Label Set ID: $LABEL_SET_ID, Label Set Version: $LABEL_SET_VERSION"
echo "Files are located in respective subdirectories of: $OUT_DIR"
echo "  - Data:     $TARGET_DATA_FILE_PATH"
echo "  - Checksum: $TARGET_CHECKSUM_FILE_PATH"
echo "  - License:  $TARGET_LICENSE_FILE_PATH"
echo "---------------------------------------------------"

exit 0 
