/**
 * Environment variables for database configuration.
 */
export interface DatabaseEnvironment {
  DATABASE_URL?: string;
  DATABASE_SCHEMA?: string;
}

/**
 * Environment variables for RPC configuration.
 */
export interface RpcEnvironment {
  [x: `RPC_URL_${number}`]: ChainIdSpecificRpcEnvironmentVariable | undefined;
  ALCHEMY_API_KEY?: string;
  DRPC_API_KEY?: string;
}

/**
 * Environment variables for ENSIndexer URL configuration.
 */
export interface EnsIndexerUrlEnvironment {
  ENSINDEXER_URL?: string;
}

/**
 * Environment variables for port configuration.
 */
export interface PortEnvironment {
  PORT?: string;
}

/**
 * Represents the raw unvalidated environment variable for the RPCs associated with a chain.
 *
 * May contain a comma separated list of one or more URLs.
 */
export type ChainIdSpecificRpcEnvironmentVariable = string;

/**
 * Environment variables for log level configuration.
 */
export type LogLevelEnvironment = {
  LOG_LEVEL?: string;
};

/**
 * Environment variables for communicating with The Graph.
 */
export type TheGraphEnvironment = {
  THEGRAPH_API_KEY?: string;
};

/**
 * Environment variables for ENS Holiday Awards date range configuration.
 *
 * Dates must be specified in ISO 8601 format (e.g., '2025-12-01T00:00:00Z').
 */
export interface EnsHolidayAwardsEnvironment {
  ENS_HOLIDAY_AWARDS_START?: string;
  ENS_HOLIDAY_AWARDS_END?: string;
}
