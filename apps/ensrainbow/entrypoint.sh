#!/bin/bash
set -euo pipefail

# Default values (can be overridden by environment variables)
SCHEMA_VERSION="${SCHEMA_VERSION:-}"
NAMESPACE="${NAMESPACE:-}"
LABEL_SET="${LABEL_SET:-}"
PORT="${PORT:-3223}"
DATA_DIR_NAME="data" # Name of the data directory within /app/apps/ensrainbow
APP_DIR="/app/apps/ensrainbow"
FINAL_DATA_DIR="${APP_DIR}/${DATA_DIR_NAME}"
DOWNLOAD_TEMP_DIR="/tmp/ensrainbow_download_temp"
MARKER_FILE="${FINAL_DATA_DIR}/.ensrainbow_db_ready"

# Ensure required variables for download are set if we might download
if [ ! -f "${MARKER_FILE}" ]; then
  if [ -z "$SCHEMA_VERSION" ] || [ -z "$NAMESPACE" ] || [ -z "$LABEL_SET" ]; then
    echo "Error: SCHEMA_VERSION, NAMESPACE, and LABEL_SET environment variables must be set for initial database download."
    exit 1
  fi
fi

echo "ENSRainbow Startup Script"
echo "-------------------------"
echo "Schema Version: $SCHEMA_VERSION"
echo "Namespace: $NAMESPACE"
echo "Label Set: $LABEL_SET"
echo "Target Port: $PORT"
echo "Application Directory: $APP_DIR"
echo "Final Data Directory: $FINAL_DATA_DIR"
echo "Marker File: $MARKER_FILE"
echo "-------------------------"

# Change to the application directory for pnpm commands
cd "${APP_DIR}"

# Check if data directory and marker file exist and if data is valid
if [ -d "${FINAL_DATA_DIR}" ] && [ -f "${MARKER_FILE}" ]; then
    echo "Existing data directory and marker file found at ${FINAL_DATA_DIR}."
    echo "Running database validation (lite) on existing data..."
    if pnpm run validate:lite --data-dir "${DATA_DIR_NAME}"; then
        echo "Existing database is valid. Skipping download and extraction."
    else
        echo "Existing database validation failed. Will attempt to re-download."
        echo "Cleaning up existing data directory before re-download..."
        rm -rf "${FINAL_DATA_DIR}" # Remove potentially corrupt data
        # The marker file is implicitly removed with FINAL_DATA_DIR
    fi
fi

# If marker file doesn't exist (meaning data is not ready or was cleared)
if [ ! -f "${MARKER_FILE}" ]; then
    echo "Database not found or not ready. Proceeding with download and extraction."

    # 1. Ensure required variables for download are set (double check, crucial if logic path leads here)
    if [ -z "$SCHEMA_VERSION" ] || [ -z "$NAMESPACE" ] || [ -z "$LABEL_SET" ]; then
        echo "Critical Error: SCHEMA_VERSION, NAMESPACE, and LABEL_SET must be set to download the database."
        exit 1
    fi

    # 2. Clean up any existing data and prepare directories
    echo "Preparing directories for download..."
    rm -rf "${FINAL_DATA_DIR}" # Ensure clean state if previous attempt failed mid-way
    mkdir -p "${FINAL_DATA_DIR}"
    rm -rf "${DOWNLOAD_TEMP_DIR}" # Clean up temp dir from previous runs if any
    mkdir -p "${DOWNLOAD_TEMP_DIR}"

    # 3. Download the database artifact
    echo "Downloading database artifact (Schema: $SCHEMA_VERSION, Namespace: $NAMESPACE, Label Set: $LABEL_SET)..."
    if ! OUT_DIR="${DOWNLOAD_TEMP_DIR}" "${APP_DIR}/download-database-artifact.sh" "$SCHEMA_VERSION" "$NAMESPACE" "$LABEL_SET"; then
      echo "Error: Failed to download database artifact."
      ls -R "${DOWNLOAD_TEMP_DIR}" # List contents for debugging
      rm -rf "${DOWNLOAD_TEMP_DIR}"
      exit 1
    fi

    ARTIFACT_BASENAME="${NAMESPACE}-${LABEL_SET}.tgz"
    ARTIFACT_PATH="${DOWNLOAD_TEMP_DIR}/databases/${SCHEMA_VERSION}/${ARTIFACT_BASENAME}"

    if [ ! -f "$ARTIFACT_PATH" ]; then
        echo "Error: Expected artifact file not found at $ARTIFACT_PATH after download attempt."
        ls -R "${DOWNLOAD_TEMP_DIR}"
        rm -rf "${DOWNLOAD_TEMP_DIR}"
        exit 1
    fi
    echo "Database artifact downloaded to: $ARTIFACT_PATH"

    # 4. Extract the artifact
    echo "Extracting artifact..."
    if ! tar -xzf "${ARTIFACT_PATH}" -C "${FINAL_DATA_DIR}" --strip-components=1; then
        echo "Error: Failed to extract artifact."
        rm -f "${ARTIFACT_PATH}"
        rm -rf "${DOWNLOAD_TEMP_DIR}"
        exit 1
    fi
    echo "Artifact extracted to ${FINAL_DATA_DIR}"

    # 5. Clean up downloaded archive and temporary directory
    echo "Cleaning up downloaded files..."
    rm -f "${ARTIFACT_PATH}"
    rm -rf "${DOWNLOAD_TEMP_DIR}"
    echo "Cleanup complete."

    # 6. Validate the newly extracted database
    echo "Running database validation (lite) on newly extracted data..."
    if pnpm run validate:lite --data-dir "${DATA_DIR_NAME}"; then
        echo "Newly extracted database is valid."
        # Create marker file upon successful download, extraction, and validation
        echo "Creating marker file: ${MARKER_FILE}"
        touch "${MARKER_FILE}"
    else
        echo "Error: Newly extracted database validation failed! Data may be corrupted."
        echo "Please check logs and artifact source. The marker file will not be created."
        # Depending on policy, you might want to exit 1 here or clean up FINAL_DATA_DIR
        exit 1 # Exit if validation fails to prevent running with bad data
    fi
fi # End of download and extraction block

# 7. Start the ENSRainbow server
echo "Starting ENSRainbow server on port ${PORT} using data from ${FINAL_DATA_DIR}..."
# pnpm commands were run from APP_DIR, ensure serve also sees --data-dir correctly
exec pnpm run serve --port "${PORT}" --data-dir "${DATA_DIR_NAME}"
