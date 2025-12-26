import type { LogLevelEnvironment, PortEnvironment } from "@ensnode/ensnode-sdk/internal";

/**
 * Represents the raw, unvalidated environment variables for the ENSRainbow application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `ENSRainbowConfig`.
 */
export type ENSRainbowEnvironment = PortEnvironment &
  LogLevelEnvironment & {
    /**
     * Directory path where the LevelDB database is stored.
     */
    DATA_DIR?: string;

    /**
     * Expected Database Schema Version.
     */
    DB_SCHEMA_VERSION?: string;

    /**
     * Expected Label Set ID.
     */
    LABEL_SET_ID?: string;

    /**
     * Expected Label Set Version.
     */
    LABEL_SET_VERSION?: string;
  };
