import type { LogLevelEnvironment, PortEnvironment } from "@ensnode/ensnode-sdk/internal";

/**
 * Raw, unvalidated environment variables for ENSRainbow.
 */
export type ENSRainbowEnvironment = PortEnvironment &
  LogLevelEnvironment & {
    DATA_DIR?: string;
    DB_SCHEMA_VERSION?: string;
  };
