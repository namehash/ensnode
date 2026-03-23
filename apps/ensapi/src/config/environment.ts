import type {
  DatabaseEnvironment,
  LogLevelEnvironment,
  PortEnvironment,
  ReferralProgramEditionsEnvironment,
  RpcEnvironment,
  TheGraphEnvironment,
} from "@ensnode/ensnode-sdk/internal";

/**
 * Environment variables for ENSApi configuration related to ENSDb.
 */
interface EnsApiEnvironmentForEnsDb extends Omit<DatabaseEnvironment, "DATABASE_SCHEMA"> {
  ENSINDEXER_SCHEMA_NAME?: string;
}

/**
 * Represents the raw, unvalidated environment variables for the ENSApi application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `EnsApiConfig`.
 */
export type EnsApiEnvironment = EnsApiEnvironmentForEnsDb &
  RpcEnvironment &
  PortEnvironment &
  LogLevelEnvironment &
  TheGraphEnvironment &
  ReferralProgramEditionsEnvironment;
