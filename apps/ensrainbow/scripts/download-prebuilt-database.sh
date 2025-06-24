#!/bin/bash
set -euo pipefail

# ==============================================================================
# Download Pre-built ENSRainbow Database Archive
#
# Goal & Motivation:
# This script downloads a pre-built and ready-to-use ENSRainbow database.
# ENSRainbow's architecture decouples the application (Docker image) from the
# data. This keeps the Docker image lightweight for faster builds and deployments.
# On first startup, the application uses this script to fetch the database,
# saving the end-user from a slow and resource-intensive data ingestion process.
#
# The database is versioned using a three-part system:
#   - DB_SCHEMA_VERSION: The physical layout/structure of the database.
#   - LABEL_SET_ID: The "namespace" or category of the data (e.g., 'testenv').
#   - LABEL_SET_VERSION: An incremental version for a given label set.
#
# This script requires these three identifiers as command-line arguments to
# download the correct pre-built database archive (.tgz), its checksum, and a
# license file from a configured ENSRainbow Labelset Server.
# ==============================================================================

# --- Configuration ---

# The base URL of the ENSRainbow Labelset Server.
# This can be overridden by the `ENSRAINBOW_LABELSET_SERVER_URL` environment variable.
ENSRAINBOW_LABELSET_SERVER_URL="${ENSRAINBOW_LABELSET_SERVER_URL:-https://bucket.ensrainbow.io}"

# Usage function
usage() {
    echo "Usage: $0 <DB_SCHEMA_VERSION> <LABEL_SET_ID> <LABEL_SET_VERSION>"
    echo "Example: $0 v1 eth mainnet"
    exit 1
}

# Check for required arguments
if [ "$#" -ne 3 ]; then
    usage
fi

DB_SCHEMA_VERSION="$1"
LABEL_SET_ID="$2"
LABEL_SET_VERSION="$3"

# Configuration
OUT_DIR="${OUT_DIR:-.}" # Default output directory, can be overridden e.g., 
BASE_URL="${ENSRAINBOW_LABELSET_SERVER_URL}"

# Construct file names and paths based on arguments
DATA_FILE_BASENAME="${LABEL_SET_ID}_${LABEL_SET_VERSION}.tgz"
SERVER_DATA_PATH="databases/${DB_SCHEMA_VERSION}/${DATA_FILE_BASENAME}"
SERVER_CHECKSUM_PATH="databases/${DB_SCHEMA_VERSION}/${DATA_FILE_BASENAME}.sha256sum"
SERVER_LICENSE_PATH="databases/${DB_SCHEMA_VERSION}/${DATA_FILE_BASENAME}.LICENSE.txt" # Common license file

echo "Starting pre-built database download..."
echo "Output Directory: $OUT_DIR"
echo "Labelset Server URL: $BASE_URL"
echo "Database Schema Version: $DB_SCHEMA_VERSION"
echo "Label Set ID: $LABEL_SET_ID"
echo "Label Set Version: $LABEL_SET_VERSION"
echo ""

# Derived local target paths
LOCAL_PREBUILT_DATABASE_DIR_PATH="$OUT_DIR/databases/${DB_SCHEMA_VERSION}"
TARGET_DATA_FILE_PATH="${LOCAL_PREBUILT_DATABASE_DIR_PATH}/${DATA_FILE_BASENAME}"
TARGET_CHECKSUM_FILE_PATH="${LOCAL_PREBUILT_DATABASE_DIR_PATH}/${DATA_FILE_BASENAME}.sha256sum"
TARGET_LICENSE_FILE_PATH="${LOCAL_PREBUILT_DATABASE_DIR_PATH}/${DATA_FILE_BASENAME}.LICENSE.txt"

# Create data directories if they don't exist
mkdir -p "$LOCAL_PREBUILT_DATABASE_DIR_PATH" # This will also create $OUT_DIR and $OUT_DIR/databases if they don't exist


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

    if wget --progress=dot:giga -O "$output_path" "$url"; then
        echo "Successfully downloaded $description."
        echo ""
    else
        rm -f "$output_path" # Clean up partially downloaded file
        if [ "$is_optional" = "true" ]; then
            echo "WARNING: Failed to download optional $description from $url. Continuing without it."
            echo ""
        else
            echo "ERROR: Failed to download $description from $url."
            exit 1
        fi
    fi
}

# Function to verify checksum
# Assumes checksum file and the data file it refers to are in the same directory ($LOCAL_PREBUILT_DATABASE_DIR_PATH)
verify_checksum() {
    local checksum_file_basename
    checksum_file_basename=$(basename "$TARGET_CHECKSUM_FILE_PATH")
    echo "Verifying checksum using $checksum_file_basename in $LOCAL_PREBUILT_DATABASE_DIR_PATH..."
    if (cd "$LOCAL_PREBUILT_DATABASE_DIR_PATH" && sha256sum --status -c "$checksum_file_basename"); then
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
    download_with_progress "$BASE_URL/$SERVER_LICENSE_PATH" "$TARGET_LICENSE_FILE_PATH" "License file ($SERVER_LICENSE_PATH)" "true"
else
    # This case is mostly for when data file was missing, but license might have been there from a previous partial run.
    echo "License file ($TARGET_LICENSE_FILE_PATH) already present."
    echo ""
fi

# 4. Download Data File (if not already present and valid)
download_with_progress "$BASE_URL/$SERVER_DATA_PATH" "$TARGET_DATA_FILE_PATH" "Pre-built database archive($DATA_FILE_BASENAME)"

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
echo "Pre-built ENSRainbow database archive download and checksum verification complete."
echo "Database Schema Version: $DB_SCHEMA_VERSION, Label Set ID: $LABEL_SET_ID, Label Set Version: $LABEL_SET_VERSION"
echo "Files are located in respective subdirectories of: $OUT_DIR"
echo "  - Data:     $TARGET_DATA_FILE_PATH"
echo "  - Checksum: $TARGET_CHECKSUM_FILE_PATH"
echo "  - License:  $TARGET_LICENSE_FILE_PATH"
echo "---------------------------------------------------"

exit 0 
