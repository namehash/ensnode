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
  QUICKNODE_API_KEY?: string;
  QUICKNODE_ENDPOINT_NAME?: string;
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
 * Environment variables for referral program editions configuration.
 *
 * If CUSTOM_REFERRAL_PROGRAM_EDITIONS is set, it should be a URL that returns
 * the JSON for a valid serialized custom referral program editions definition.
 */
export interface ReferralProgramEditionsEnvironment {
  /**
   * Optional URL that returns the JSON for a valid serialized custom referral program editions definition.
   * If not set, the default edition set will be used.
   */
  CUSTOM_REFERRAL_PROGRAM_EDITIONS?: string;
}
