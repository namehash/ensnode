import { Blockrange } from "@/lib/types";
import type { ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";
import type { ENSIndexerPublicConfig, PluginName } from "@ensnode/ensnode-sdk";

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
  url: URL;

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
   * The ENS namespace that ENSNode operates in the context of, defaulting to 'mainnet' (DEFAULT_NAMESPACE).
   *
   * See {@link ENSNamespaceIds} for available namespace identifiers.
   */
  namespace: ENSNamespaceId;

  /**
   * An ENSAdmin url, defaulting to the public instance https://admin.ensnode.io (DEFAULT_ENSADMIN_URL).
   * @see https://ensnode.io/ensadmin/overview/what-is-ensadmin
   *
   * The ENSNode root api route `/` redirects to {@link ensAdminUrl}, configuring
   * ENSAdmin with an entry for this instance of ENSNode, identified by {@link ensNodePublicUrl}.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensAdminUrl: URL;

  /**
   * The publicly accessible endpoint of the ENSNode api (ex: http://localhost:42069).
   *
   * ENSAdmin will use this url to connect to the ENSNode api for querying state about the ENSNode instance.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensNodePublicUrl: URL;

  /**
   * An ENSRainbow API Endpoint (ex: http://localhost:3223). ENSIndexer uses ENSRainbow to 'heal'
   * unknown labelhashes.
   * @see https://ensnode.io/ensrainbow/overview/what-is-ensrainbow
   *
   * For best performance, ENSRainbow should be colocated with ENSIndexer and use private/internal
   * networking to minimize latency.
   *
   * Invariant:
   * - The URL must be a valid URL. localhost urls are allowed (and expected).
   */
  ensRainbowUrl: URL;

  /**
   * A Postgres database schema name. This instance of ENSIndexer will write indexed data to the
   * tables in this schema.
   *
   * The {@link databaseSchemaName} must be unique per running instance of ENSIndexer (ponder will
   * enforce this with database locks). If multiple instances of ENSIndexer with the same
   * {@link databaseSchemaName} are running, only the first will successfully acquire the lock and begin
   * indexing: the rest will crash.
   *
   * If an ENSIndexer instance with the same configuration (including `databaseSchemaName`) is
   * started, and it successfully acquires the lock on this schema, it will continue indexing from
   * the current state.
   *
   * Many clients can read from this Postgres schema during or after indexing.
   *
   * Read more about database schema rules here:
   * @see https://ponder.sh/docs/api-reference/database#database-schema-rules
   *
   * Invariants:
   * - Must be a non-empty string that is a valid Postgres database schema identifier.
   */
  databaseSchemaName: string;

  /**
   * A set of {@link PluginName}s indicating which plugins to activate.
   *
   * Invariants:
   * - A set of valid {@link PluginName}s with at least one value
   * - For each plugin, its required datasources must be defined within the {@link namespace}
   * - For each plugin specified, a valid {@link rpcConfigs} entry is required for
   *   each chain the plugin indexes
   */
  plugins: PluginName[];

  /**
   * Enable or disable healing of addr.reverse subnames, defaulting to true (DEFAULT_HEAL_REVERSE_ADDRESSES).
   * If this is set to true, ENSIndexer will attempt to heal subnames of addr.reverse.
   *
   * Note that enabling {@link healReverseAddresses} results in indexed data no longer being backwards
   * compatible with the ENS Subgraph. For full data-level backwards compatibility with the ENS
   * Subgraph, {@link healReverseAddresses} should be `false`.
   */
  healReverseAddresses: boolean;

  /**
   * Enable or disable the indexing of Resolver record values, defaulting to true (DEFAULT_INDEX_ADDITIONAL_RESOLVER_RECORDS).
   * If this is set to false, ENSIndexer will apply subgraph-backwards compatible logic that only tracks the keys of Resolver records.
   * If this is set to true, ENSIndexer will track both the keys and the values of Resolver records.
   *
   * WARNING: Special care must be taken when interacting with indexed resolver record values. It is
   * unsafe to naively assume that indexed resolver record values are equivalent to the resolver
   * record values that would be returned through dynamic lookups via the ENS protocol. For example,
   * if a resolver implements CCIP-Read, the resolver records may not be discoverable through
   * onchain indexing. This feature is under R&D. At this time we do not recommend anyone directly
   * use indexed resolver record values in their applications. Features are planned in the ENSNode
   * roadmap that will provide safe use of indexed resolver record values (in appropriate contexts).
   *
   * Note that enabling {@link indexAdditionalResolverRecords} results in indexed data becoming a _superset_ of
   * the Subgraph. For exact data-level backwards compatibility with the ENS Subgraph,
   * {@link indexAdditionalResolverRecords} should be `false`.
   */
  indexAdditionalResolverRecords: boolean;

  /**
   * Experiment to enable forward/reverse resolution APIs.
   */
  experimentalResolution: boolean;

  /**
   * The network port ENSIndexer listens for http requests on, defaulting to 42069 (DEFAULT_PORT).
   *
   * Invariants:
   * - The port must be an integer between 1 and 65535
   */
  port: number;

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

  /**
   * Constrains the global blockrange for indexing, useful for testing purposes.
   *
   * This is strictly designed for testing and development and its usage in production will result
   * in incorrect or out-of-date indexes.
   *
   * ENSIndexer will constrain all indexed contracts to the provided {@link Blockrange.startBlock}
   * and {@link Blockrange.endBlock} if specified.
   *
   * Invariants:
   * - both `startBlock` and `endBlock` are optional, and expected to be undefined
   * - if defined, startBlock must be an integer greater than 0
   * - if defined, endBlock must be an integer greater than 0
   * - if defined, endBlock must be greater than startBlock
   * - if either `startBlock` or `endBlock` are defined, the number of indexed chains described
   *   by {@link plugins} must be 1
   */
  globalBlockrange: Blockrange;

  /**
   * A flag derived from the built config indicating whether ENSIndexer is operating in a
   * subgraph-compatible way. This flag is true if:
   * a) only the subgraph plugin is activated,
   * b) healReverseAddresess is false, and
   * c) indexRecordValues is false
   *
   * If {@link isSubgraphCompatible} is true, ENSIndexer will:
   * 1) use subgraph-compatible IDs for entities and events
   * 2) limit indexing behavior to subgraph indexing semantics
   */
  isSubgraphCompatible: boolean;
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
  databaseSchemaName: string | undefined;
  databaseUrl: string | undefined;
  namespace: string | undefined;
  plugins: string | undefined;
  ensRainbowUrl: string | undefined;
  ensNodePublicUrl: string | undefined;
  ensAdminUrl: string | undefined;
  healReverseAddresses: string | undefined;
  indexAdditionalResolverRecords: string | undefined;
  experimentalResolution: string | undefined;
  globalBlockrange: {
    startBlock: string | undefined;
    endBlock: string | undefined;
  };
  rpcConfigs: Record<number, RpcConfigEnvironment>;
  versionInfo: {
    nodejs: string | undefined;
    ponder: string | undefined;
    ensRainbow: string | undefined;
    ensRainbowSchema: number | undefined;
  };
}
