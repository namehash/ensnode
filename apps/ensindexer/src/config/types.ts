import { Blockrange } from "@/lib/types";
import type { ENSDeployments } from "@ensnode/ens-deployments";
import type { PluginName } from "@ensnode/utils";

/**
 * Configuration for a single blockchain network (chain) used by ENSIndexer.
 *
 * Invariants:
 * - The keys (chainId) must be an integer
 */
export interface RpcConfig {
  /**
   * The RPC endpoint URL for the chain.
   * Example: "https://eth-mainnet.g.alchemy.com/v2/..."
   * This must be an endpoint with high rate limits
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  url: string;

  /**
   * The maximum number of RPC requests per second allowed for this chain.
   * This is used to avoid rate limiting by the RPC provider. This value
   * is optional and defaults to DEFAULT_RPC_RATE_LIMIT if not specified.
   *
   * Invariants:
   * - The value must be an integer greater than 0
   */
  maxRequestsPerSecond: number;
}

/**
 * The complete runtime configuration for an ENSIndexer application instance.
 */
export interface ENSIndexerConfig {
  /**
   * The ENS Deployment for the indexer which could be "mainnet", "sepolia", etc.
   *
   * (see `@ensnode/ens-deployments` for available deployments)
   */
  ensDeploymentChain: keyof typeof ENSDeployments;

  /**
   * This is purely a testing configuration and should NOT be used in production.
   * It is used to override the global block range. For this to take effect,
   * there must be a single chain in use in the config or the application will
   * throw an error.
   *
   * If these values are set, the indexer will set the end block on all contracts
   * to be the provided endBlock. It will not index any blocks beyond this range.
   *
   * The startBlock will be used to override the start block of each chain's
   * contract if it is greater than the contract's start block.
   *
   * The logic is present in `constrainContractBlockrange`.
   *
   * If these values are not set, the indexer will index the entire available
   * block range for the chain.
   *
   * Invariants:
   * - both startBlock and endBlock are optional, and expected to be undefined
   *   in most cases (always in production)
   * - there is be a single chain in use in the indexer if these values are set
   * - startBlock must be an integer greater than 0 or undefined
   * - endBlock must be an integer greater than 0 or undefined
   * - endBlock must be greater than or equal to startBlock
   */
  globalBlockrange: Blockrange;

  /**
   * The ENSIndexer public service URL
   *
   * When the root route `/` of ENSIndexer receives a request, ENSIndexer redirects to the
   * configured ENSADMIN_URL with an instruction for that ENSAdmin instance to connect back to this
   * provided URL for querying state about the ENSNode instance.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensNodePublicUrl: string;

  /**
   * The ENSAdmin service URL.
   *
   * When the root route `/` of ENSIndexer receives a request, ENSIndexer redirects to this
   * provided ENSAdmin URL with an instruction for that ENSAdmin instance to connect back to the
   * configured ENSNODE_PUBLIC_URL.
   *
   * If this is not set, DEFAULT_ENSADMIN_URL will be used to provide easy access to an ENSAdmin UI.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensAdminUrl: string;

  /**
   * A Postgres database schema name. This instance of ENSIndexer will write indexed data to the
   * tables in this schema.
   *
   * The `ponderDatabaseSchema` must be unique per running instance of ENSIndexer (ponder will
   * enforce this with database locks). If multiple instances of ENSIndexer with the same
   * `ponderDatabaseSchema` are running, only the first will successfully acquire the lock and begin
   * indexing: the rest will crash.
   *
   * If an ENSIndexer instance with the same configuration (including `ponderDatabaseSchema`) is
   * started, and it successfully acquires the lock on this schema, it will continue indexing from
   * the current state.
   *
   * Many clients can read from this Postgres schema during or after indexing.
   *
   * Read more about database schema rules here:
   * https://ponder.sh/docs/api-reference/database#database-schema-rules
   *
   * Invariant: Must be a non-empty string that is a valid Postgres database schema identifier.
   */
  ponderDatabaseSchema: string;

  /**
   * Identify which indexer plugins to activate (see `src/plugins` for available plugins)
   * This is a set of one or more available {@link PluginName}s.
   *
   * Invariants:
   * - A set of valid {@link PluginName}s with at least one value
   * - For each plugin, it should be valid within the specified {@link ENSIndexerConfig.ensDeployment}
   * - For each plugin specified, a valid {@link ENSIndexerConfig.rpcConfigs} entry is required
   */
  plugins: PluginName[];

  /**
   * A feature flag to enable or disable healing of addr.reverse subnames.
   * If this is set to true, ENSIndexer will attempt to heal subnames of
   * addr.reverse.
   *
   * If this is not set, the default value is set to `DEFAULT_HEAL_REVERSE_ADDRESSES`.
   *
   * Setting this to `true` results in indexed data no longer being backwards
   * compatible with the ENS Subgraph. For full data-level backwards
   * compatibility with the ENS Subgraph, this should be set to `false`.
   *
   * Invariant: The value must be 'true' or 'false'
   */
  healReverseAddresses: boolean;

  /**
   * The network port ENSIndexer listens for http requests on. ENSIndexer
   * exposes various APIs, most notably the GRAPHQL API. All APIs are accessible
   * on the same port. This defaults to DEFAULT_PORT if not specified.
   *
   * Invariants:
   * - The port must be an integer between 1 and 65535
   */
  port: number;

  /**
   * The endpoint URL for the ENSRainbow API. ENSIndexer uses this for fetching
   * data about labelhashes (healing) when indexing. This should be set to a
   * colocated instance of ENSRainbow for best performance.
   *
   * Invariant: The URL must be a valid URL. localhost urls are allowed,
   * and expected.
   */
  ensRainbowEndpointUrl: string;

  /**
   * Configuration for each indexed chain, keyed by chain ID.
   *
   * Invariants:
   * - Each key (chainId) must be a number
   * - For any requested plugin, the config will have a key for chainId in this
   *   indexedChains object which is ensured by the validateChainConfigs
   *   function in `validations.ts` and not part of the schema validation here.
   */
  rpcConfigs: Record<number, RpcConfig>;

  /**
   * The database connection string for the indexer if present. When undefined
   * ponder will default to using an in-memory database, pglite.
   *
   * Invariants:
   * - The URL must be a valid PostgreSQL connection string or undefined.
   */
  databaseUrl: string | undefined;
}

/**
 * Represents the raw unvalidated environment variables for a single chain.
 *
 * Since an RPC_URL_<chainId> is checked in `getChainsFromEnv`, the value
 * for rpcEndpointUrl is guaranteed to be a non-empty string.
 *
 * rpcMaxRequestsPerSecond is optional and will be undefined if the
 * RPC_REQUEST_RATE_LIMIT_<chainId> environment variable is not set.
 */
export interface RawRpcConfig {
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
  globalBlockrange: {
    startBlock: string | undefined;
    endBlock: string | undefined;
  };
  rpcConfigs: Record<number, RawRpcConfig>;
}
