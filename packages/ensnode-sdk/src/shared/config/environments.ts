// TODO: docstring
export interface DatabaseEnvironment {
  DATABASE_URL?: string;
  DATABASE_SCHEMA?: string;
}

// TODO: docstring
export interface RpcEnvironment {
  [x: `RPC_URL_${number}`]: ChainIdSpecificRpcEnvironmentVariable | undefined;
  ALCHEMY_API_KEY?: string;
  DRPC_API_KEY?: string;
}

// TODO: docstring
export interface EnsIndexerUrlEnvironment {
  ENSINDEXER_URL?: string;
}

// TODO: docstring
export interface EnsNamespaceEnvironment {
  NAMESPACE?: string;
}

/**
 * Represents the raw unvalidated environment variable for the RPCs associated with a chain.
 *
 * May contain a comma separated list of one or more URLs.
 */
export type ChainIdSpecificRpcEnvironmentVariable = string;
