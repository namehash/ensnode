import type {
  DatabaseEnvironment,
  EnsIndexerUrlEnvironment,
  LogLevelEnvironment,
  PortEnvironment,
  RpcEnvironment,
} from "@ensnode/ensnode-sdk/internal";

/**
 * Represents the raw, unvalidated environment variables for the ENSApi application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `EnsApiConfig`.
 */
export type EnsApiEnvironment = Omit<DatabaseEnvironment, "DATABASE_SCHEMA"> &
  EnsIndexerUrlEnvironment &
  RpcEnvironment &
  PortEnvironment &
  LogLevelEnvironment;
