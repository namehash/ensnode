#!/bin/bash
set -euo pipefail

# Default values (can be overridden by environment variables)
DB_SCHEMA_VERSION="${DB_SCHEMA_VERSION:-}"
LABEL_SET_ID="${LABEL_SET_ID:-}"
LABEL_SET_VERSION="${LABEL_SET_VERSION:-}"
PORT="${PORT:-3223}"
DATA_DIR_NAME="data" # Name of the data directory within /app/apps/ensrainbow
APP_DIR="/app/apps/ensrainbow"
FINAL_DATA_DIR="${APP_DIR}/${DATA_DIR_NAME}"
DOWNLOAD_TEMP_DIR="/tmp/ensrainbow_download_temp"
MARKER_FILE="${FINAL_DATA_DIR}/ensrainbow_db_ready"

# Path for the data subdirectory, relative to APP_DIR.
# This assumes data is in ${APP_DIR}/${DATA_DIR_NAME}/data-${LABEL_SET_ID}/
DB_SUBDIR_PATH="${DATA_DIR_NAME}/data-${LABEL_SET_ID}_${LABEL_SET_VERSION}"

# Ensure required variables for download are set if we might download
if [ ! -f "${MARKER_FILE}" ]; then
  if [ -z "$DB_SCHEMA_VERSION" ] || [ -z "$LABEL_SET_ID" ] || [ -z "$LABEL_SET_VERSION" ]; then
    echo "Error: DB_SCHEMA_VERSION, LABEL_SET_ID, and LABEL_SET_VERSION environment variables must be set for initial ENSRainbow database download."
    exit 1
  fi
fi

echo "ENSRainbow Startup Script"
echo "-------------------------"
echo "Database Schema Version: $DB_SCHEMA_VERSION"
echo "Label Set ID: $LABEL_SET_ID"
echo "Label Set Version: $LABEL_SET_VERSION"
echo "Target Port: $PORT"
echo "Application Directory: $APP_DIR"
echo "Final Data Directory: $FINAL_DATA_DIR"
echo "Marker File: $MARKER_FILE"
echo "Database Directory: $DB_SUBDIR_PATH"
echo "-------------------------"

# Change to the application directory for pnpm commands
cd "${APP_DIR}"

# Check if data directory and marker file exist and if data is valid
if [ -d "${FINAL_DATA_DIR}" ] && [ -f "${MARKER_FILE}" ]; then
    echo "Existing data directory and marker file found at ${FINAL_DATA_DIR}."
    echo "Running database validation (lite) on existing data in ${DB_SUBDIR_PATH}..."
    if pnpm run validate:lite --data-dir "${DB_SUBDIR_PATH}"; then
        echo "Existing database is valid. Skipping download and extraction."
    else
        echo "Existing database validation failed. Will attempt to re-download."
        echo "Cleaning up existing data directory before re-download..."
        rm -rf "${FINAL_DATA_DIR}/"* # Remove potentially corrupt data
        # The marker file is implicitly removed with FINAL_DATA_DIR
    fi
fi

# If marker file doesn't exist (meaning data is not ready or was cleared)
if [ ! -f "${MARKER_FILE}" ]; then
    echo "Database not found or not ready. Proceeding with download and extraction."

    # 1. Ensure required variables for download are set (double check, crucial if logic path leads here)
    if [ -z "$DB_SCHEMA_VERSION" ] || [ -z "$LABEL_SET_ID" ] || [ -z "$LABEL_SET_VERSION" ]; then
        echo "Critical Error: DB_SCHEMA_VERSION, LABEL_SET_ID, and LABEL_SET_VERSION must be set to download the database."
        exit 1
    fi

    # 2. Clean up any existing data and prepare directories
    echo "Preparing directories for download..."
    rm -rf "${FINAL_DATA_DIR}"/* # Ensure clean state if previous attempt failed mid-way
    mkdir -p "${FINAL_DATA_DIR}"
    rm -rf "${DOWNLOAD_TEMP_DIR}" # Clean up temp dir from previous runs if any
    mkdir -p "${DOWNLOAD_TEMP_DIR}"

    # 3. Download the database archive
    echo "Downloading pre-built ENSRainbowdatabase from labelset server (Schema: $DB_SCHEMA_VERSION, Label Set ID: 
    $LABEL_SET_ID, Label Set Version: $LABEL_SET_VERSION)..."
    if ! OUT_DIR="${DOWNLOAD_TEMP_DIR}" \
        ENSRAINBOW_LABELSET_SERVER_URL="${ENSRAINBOW_LABELSET_SERVER_URL:-}" \
        "${APP_DIR}/scripts/download-prebuilt-database.sh" "$DB_SCHEMA_VERSION" "$LABEL_SET_ID" "$LABEL_SET_VERSION"; then
      echo "Error: Failed to download database."
      ls -R "${DOWNLOAD_TEMP_DIR}" # List contents for debugging
      rm -rf "${DOWNLOAD_TEMP_DIR}"
      exit 1
    fi

    DB_ARCHIVE_BASENAME="${LABEL_SET_ID}_${LABEL_SET_VERSION}.tgz"
    DB_ARCHIVE_PATH="${DOWNLOAD_TEMP_DIR}/databases/${DB_SCHEMA_VERSION}/${DB_ARCHIVE_BASENAME}"

    if [ ! -f "$DB_ARCHIVE_PATH" ]; then
        echo "Error: Expected database archive file not found at $DB_ARCHIVE_PATH after download attempt."
        ls -R "${DOWNLOAD_TEMP_DIR}"
        rm -rf "${DOWNLOAD_TEMP_DIR}"
        exit 1
    fi
    echo "Database archive downloaded to: $DB_ARCHIVE_PATH"

    # 4. Extract the database archive
    echo "Extracting database archive..."
    if ! tar -xzf "${DB_ARCHIVE_PATH}" -C "${FINAL_DATA_DIR}" --strip-components=1; then
        echo "Error: Failed to extract database archive."
        rm -f "${DB_ARCHIVE_PATH}"
        rm -rf "${DOWNLOAD_TEMP_DIR}"
        exit 1
    fi
    echo "Database archive extracted to ${FINAL_DATA_DIR}"

    # 5. Clean up downloaded archive and temporary directory
    echo "Cleaning up downloaded files..."
    rm -f "${DB_ARCHIVE_PATH}"
    rm -rf "${DOWNLOAD_TEMP_DIR}"
    echo "Cleanup complete."

    # 6. Validate the newly extracted database
    echo "Running database validation (lite) on newly extracted data in ${DB_SUBDIR_PATH}..."
    if pnpm run validate:lite --data-dir "${DB_SUBDIR_PATH}"; then
        echo "Newly extracted database is valid."
        # Create marker file upon successful download, extraction, and validation
        echo "Creating marker file: ${MARKER_FILE}"
        touch "${MARKER_FILE}"
    else
        echo "Error: Newly extracted database validation failed! Data may be corrupted."
        echo "Please check logs and database archive source. The marker file will not be created."
        # Depending on policy, you might want to exit 1 here or clean up FINAL_DATA_DIR
        exit 1 # Exit if validation fails to prevent running with bad data
    fi
fi # End of download and extraction block

# 7. Start the ENSRainbow server
echo "Starting ENSRainbow server on port ${PORT} using data from ${APP_DIR}/${DB_SUBDIR_PATH}..."
# pnpm commands were run from APP_DIR, ensure serve also sees --data-dir correctly
exec pnpm run serve --port "${PORT}" --data-dir "${DB_SUBDIR_PATH}"
