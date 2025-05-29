import type { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";

/**
 * Configuration for a single RPC used by ENSIndexer.
 */
export interface RpcConfig {
  /**
   * The RPC endpoint URL for the chain (ex: "https://eth-mainnet.g.alchemy.com/v2/...").
   * For nominal indexing behavior, must be an endpoint with high rate limits.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  url: string;

  /**
   * The maximum number of RPC requests per second allowed for this chain, defaulting to
   * 500 (DEFAULT_RPC_RATE_LIMIT). This is used to avoid rate limiting by the RPC provider.
   *
   * Invariants:
   * - The value must be an integer greater than 0
   */
  maxRequestsPerSecond: number;
}

/**
 * The complete runtime configuration for an ENSIndexer instance.
 */
export interface ENSIndexerConfig extends ENSIndexerPublicConfig {
  /**
   * Configuration for each indexable RPC, keyed by chain id.
   *
   * Invariants:
   * - Each key (chain id) must be a number
   */
  rpcConfigs: Record<number, RpcConfig>;

  /**
   * The database connection string for the indexer, if present. When undefined
   * ponder will default to using an in-memory database (pglite).
   *
   * Invariants:
   * - If defined, the URL must be a valid PostgreSQL connection string
   */
  databaseUrl: string | undefined;
}

/**
 * Represents the raw unvalidated environment variables for an rpc endpoint.
 */
export interface RpcConfigEnvironment {
  url: string;
  maxRequestsPerSecond: string | undefined;
}

/**
 * Represents the raw, unvalidated environment variables for the ENSIndexer application.
 *
 * Keys correspond to the environment variable names, and all values are
 * strings or undefined, reflecting their state in `process.env`.
 * This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `ENSIndexerConfig`.
 */
export interface ENSIndexerEnvironment {
  port: string | undefined;
  ponderDatabaseSchema: string | undefined;
  databaseUrl: string | undefined;
  ensDeploymentChain: string | undefined;
  plugins: string | undefined;
  ensRainbowEndpointUrl: string | undefined;
  ensNodePublicUrl: string | undefined;
  ensAdminUrl: string | undefined;
  healReverseAddresses: string | undefined;
  indexAdditionalResolverRecords: string | undefined;
  globalBlockrange: {
    startBlock: string | undefined;
    endBlock: string | undefined;
  };
  rpcConfigs: Record<number, RpcConfigEnvironment>;
}
