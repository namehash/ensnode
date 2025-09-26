import type { ENSNamespaceId } from "@ensnode/datasources";
import type { Blockrange, ChainId, ChainIdString, PluginName } from "@ensnode/ensnode-sdk";
import type { EnsRainbowClientLabelSet } from "@ensnode/ensrainbow-sdk";

/**
 * Indexing RPC configuration for a single chain.
 *
 * Ponder automatically manages the use of provided RPC endpoints.
 *
 * @see https://ponder.sh/docs/config/chains#rpc-endpoints
 * @see https://ponder.sh/docs/config/chains#websocket
 */
export interface RpcConfig {
  /**
   * The HTTP endpoint URLs for RPCs to the chain (ex: "https://eth-mainnet.g.alchemy.com/v2/...").
   * For proper indexing behavior, each RPC must support high request rate limits (ex: 500+ requests a second).
   *
   * The order of RPC URLs matters. The first HTTP/HTTPS RPC for a given chain
   * will be the RPC that is used for Resolution API request processing.
   *
   * Invariants:
   * - Includes one or more URLs
   * - Each URL in the array is guaranteed to be distinct
   * - Each URL protocol is guaranteed to be "http:" or "https:"
   */
  httpRPCs: [URL, ...URL[]];

  /**
   * The websocket RPC for the chain.
   *
   * If defined, it is used to accelerate discovery of new "realtime" blocks.
   *
   * Invariants:
   * - If defined, URL protocol is guaranteed to be "ws:" or "wss:".
   */
  websocketRPC?: URL;
}

/**
 * The complete runtime configuration for an ENSIndexer instance.
 */
export interface ENSIndexerConfig {
  /**
   * The ENS namespace that ENSNode operates in the context of.
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
   * - localhost urls are allowed (and expected).
   */
  ensAdminUrl: URL;

  /**
   * The publicly accessible endpoint of the ENSNode api (ex: http://localhost:42069).
   *
   * ENSAdmin will use this url to connect to the ENSNode api for querying state about the ENSNode instance.
   *
   * Invariants:
   * - localhost urls are allowed (and expected).
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
   * - localhost urls are allowed (and expected).
   */
  ensRainbowUrl: URL;

  /**
   * The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
   */
  labelSet: Required<EnsRainbowClientLabelSet>;

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
   * - Each value in {@link indexedChainIds} is guaranteed to
   *   have its {@link RpcConfig} included here.
   * - Note: There may be some {@link RpcConfig} values preset for
   *   chain IDs that are not included in {@link indexedChainIds}. In other words, the keys
   *   of {@link rpcConfigs} is a superset of {@link indexedChainIds}.
   */
  rpcConfigs: Map<ChainId, RpcConfig>;

  /**
   * Indexed Chain IDs
   *
   * Includes the {@link ChainId} for each chain being indexed.
   */
  indexedChainIds: Set<ChainId>;

  /**
   * The database connection string for the indexer, if present. When undefined
   * ponder will default to using an in-memory database (pglite).
   *
   * Invariants:
   * - If defined, the URL must be a valid PostgreSQL connection string
   */
  databaseUrl: string | undefined;

  /**
   * The "primary" ENSIndexer service URL
   * This must be an instance of ENSIndexer using either `ponder start`
   * or `ponder dev`, and not `ponder serve`.
   * This URL is used to read Ponder's internal indexing state using
   * the `/status` and `/metrics` endpoints that are served directly by Ponder
   * within the specified ENSIndexer.
   * For ENSIndexer instances started using `ponder start` or `ponder dev`,
   * this should be configured so that ENSIndexer refers back to itself, ex:
   * http://localhost:{port}. For ENSIndexer instances started using
   * `ponder serve`, this should be set to the hostname of
   * the related ENSIndexer instance started using `ponder start` or
   * `ponder dev` that is writing to the same ENSDb.
   */
  ensIndexerUrl: URL;

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
   * A feature flag to enable/disable ENSIndexer's Subgraph Compatible Indexing Behavior.
   *
   * If {@link isSubgraphCompatible} is true, indexing behavior will match that of the legacy ENS
   * Subgraph.
   *
   * ENSIndexer will store and return Literal Labels and Literal Names without further interpretation.
   * @see https://ensnode.io/docs/reference/terminology#literal-label
   * @see https://ensnode.io/docs/reference/terminology#literal-name
   *
   * If {@link isSubgraphCompatible} is true, the following invariants are true for the ENSIndexerConfig:
   * 1. only the 'subgraph' plugin is enabled, and
   * 2. the labelSet must be { labelSetId: 'subgraph', labelSetVersion: 0 }
   *
   * If {@link isSubgraphCompatible} is false, ENSIndexer will additionally:
   *
   * 1. ENSIndexer will heal all subnames of addr.reverse on the ENS Root Chain.
   *
   * 2. ENSIndexer will track both the keys and the values of Resolver records.
   *
   * WARNING: Special care must be taken when interacting with indexed resolver record values. It
   * is unsafe to naively assume that indexed resolver record values are equivalent to the
   * resolver record values that would be returned through dynamic lookups via the ENS protocol.
   * For example, if a resolver implements CCIP-Read, the resolver records may not be
   * discoverable through onchain indexing.
   *
   * 3. Literal Labels and Literal Names encountered by ENSIndexer will be Interpreted.
   * @see https://ensnode.io/docs/reference/terminology#interpreted-label
   * @see https://ensnode.io/docs/reference/terminology#interpreted-name
   *
   * That is,
   * a) all Labels stored and returned by ENSIndexer will be Interpreted Labels, which are either:
   *    i. normalized, or
   *    ii. represented as an Encoded LabelHash of the Literal Label value found onchain, and
   * b) all Names stored and returned by ENSIndexer will be Interpreted Names, which are exclusively
   *   composed of Interpreted Labels.
   */
  isSubgraphCompatible: boolean;
}

/**
 * Represents the raw unvalidated environment variable for the RPCs associated with a chain.
 *
 * It might be a single URL string, or a comma separated list of URL strings.
 */
export type RpcConfigEnvironment = string;

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
  labelSet: {
    labelSetId: string | undefined;
    labelSetVersion: string | undefined;
  };
  ensNodePublicUrl: string | undefined;
  ensIndexerUrl: string | undefined;
  ensAdminUrl: string | undefined;
  globalBlockrange: {
    startBlock: string | undefined;
    endBlock: string | undefined;
  };
  rpcConfigs: Record<ChainIdString, RpcConfigEnvironment>;
  isSubgraphCompatible: string | undefined;
}
