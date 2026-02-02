import type { EnsRainbowClientLabelSet } from "@ensnode/ensnode-sdk";

/**
 * The complete runtime configuration for an ENSRainbow instance.
 *
 * This interface defines all configuration parameters needed to run an ENSRainbow server,
 * which provides label healing services for ENS names.
 */
export interface ENSRainbowConfig {
  /**
   * The port number on which the ENSRainbow server listens.
   *
   * The HTTP server will bind to this port and serve the ENSRainbow API.
   *
   * Default: 3223 (defined by {@link ENSRAINBOW_DEFAULT_PORT})
   *
   * Invariants:
   * - Must be a valid port number (1-65535)
   * - Must not be already in use by another process
   */
  port: number;

  /**
   * The absolute path to the data directory where ENSRainbow stores its database and other files.
   *
   * This directory will contain:
   * - The SQLite database file with label set data
   * - Any temporary files created during operation
   *
   * If a relative path is provided in the environment variable, it will be resolved to an
   * absolute path relative to the current working directory.
   *
   * Default: `{cwd}/ensrainbow-data` or `/data` in Docker
   *
   * Invariants:
   * - Must be a non-empty string
   * - Must be an absolute path after resolution
   * - The process must have read/write permissions to this directory
   */
  dataDir: string;

  /**
   * The database schema version expected by the code.
   *
   * This version number corresponds to the structure of the SQLite database that ENSRainbow
   * uses to store label set data. If the version in the environment doesn't match the version
   * expected by the code, the application will fail to start.
   *
   * This prevents version mismatches between the codebase and the database schema, which could
   * lead to data corruption or runtime errors.
   *
   * Default: {@link DB_SCHEMA_VERSION} (currently 3)
   *
   * Invariants:
   * - Must be a positive integer
   * - Must match {@link DB_SCHEMA_VERSION} exactly
   */
  dbSchemaVersion: number;

  /**
   * Optional label set configuration that specifies which label set to use.
   *
   * A label set defines which labels (domain name segments) are available for label healing.
   * Both `labelSetId` and `labelSetVersion` must be provided together to create a "fully pinned"
   * label set reference, ensuring deterministic and reproducible label healing.
   *
   * If not provided, ENSRainbow will start without any label set loaded, and label healing
   * requests will fail until a label set is loaded via the management API.
   *
   * Examples:
   * - `{ labelSetId: "subgraph", labelSetVersion: 0 }` - The legacy subgraph label set
   * - `{ labelSetId: "ensip-15", labelSetVersion: 1 }` - ENSIP-15 normalized labels
   *
   * Default: undefined (no label set)
   *
   * Invariants:
   * - If provided, both `labelSetId` and `labelSetVersion` must be defined
   * - `labelSetId` must be 1-50 characters, containing only lowercase letters (a-z) and hyphens (-)
   * - `labelSetVersion` must be a non-negative integer
   * - If only one of LABEL_SET_ID or LABEL_SET_VERSION is provided in the environment,
   *   configuration parsing will fail with a clear error message
   */
  labelSet?: Required<EnsRainbowClientLabelSet>;
}
