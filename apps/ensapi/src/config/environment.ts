import type {
  DatabaseEnvironment,
  EnsHolidayAwardsEnvironment,
  EnsIndexerUrlEnvironment,
  LogLevelEnvironment,
  PortEnvironment,
  RpcEnvironment,
  TheGraphEnvironment,
} from "@ensnode/ensnode-sdk/internal";

/**
 * Environment variables for OpenAPI generation mode.
 *
 * When enabled, ENSApi starts with a minimal mock configuration,
 * bypassing the need for external dependencies like a database or ENSIndexer.
 */
export interface OpenApiGenerateModeEnvironment {
  OPENAPI_GENERATE_MODE?: string;
}

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
  LogLevelEnvironment &
  TheGraphEnvironment &
  EnsHolidayAwardsEnvironment &
  OpenApiGenerateModeEnvironment;
