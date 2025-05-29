import type { ENSDeploymentChain } from "@ensnode/ens-deployments";
import type { PluginName } from "@ensnode/ensnode-sdk";

/**
 * The public runtime configuration for an ENSIndexer instance.
 */
export interface ENSIndexerPublicConfig {
  /**
   * The ENS Deployment that ENSIndexer is targeting, defaulting to 'mainnet' (DEFAULT_ENS_DEPLOYMENT_CHAIN).
   *
   * See {@link ENSDeploymentChain} for available deployments.
   */
  ensDeploymentChain: ENSDeploymentChain;

  /**
   * A list of chain IDs indicating chains required for indexing operations.
   */
  indexedChainIds: number[];

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
  ensAdminUrl: string;

  /**
   * The publicly accessible endpoint of the ENSNode api (ex: http://localhost:42069).
   *
   * ENSAdmin will use this url to connect to the ENSNode api for querying state about the ENSNode instance.
   *
   * Invariants:
   * - The URL must be a valid URL (localhost urls are allowed)
   */
  ensNodePublicUrl: string;

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
  ensRainbowEndpointUrl: string;

  /**
   * A Postgres database schema name. This instance of ENSIndexer will write indexed data to the
   * tables in this schema.
   *
   * The {@link ponderDatabaseSchema} must be unique per running instance of ENSIndexer (ponder will
   * enforce this with database locks). If multiple instances of ENSIndexer with the same
   * {@link ponderDatabaseSchema} are running, only the first will successfully acquire the lock and begin
   * indexing: the rest will crash.
   *
   * If an ENSIndexer instance with the same configuration (including `ponderDatabaseSchema`) is
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
  ponderDatabaseSchema: string;

  /**
   * A set of {@link PluginName}s indicating which plugins to activate.
   *
   * Invariants:
   * - A set of valid {@link PluginName}s with at least one value
   * - For each plugin, it should be available on the specified {@link ensDeploymentChain}
   * - For each plugin specified, a valid {@link rpcConfigs} entry is required for
   *   each chain the plugin indexes
   */
  plugins: PluginName[];

  /**
   * Enable or disable healing of addr.reverse subnames, defaulting to true (DEFAULT_HEAL_REVERSE_ADDRESSES).
   * If this is set to true, ENSIndexer will attempt to heal subnames of addr.reverse.
   *
   * Note that enabling `healReverseAddresses` results in indexed data no longer being backwards
   * compatible with the ENS Subgraph. For full data-level backwards compatibility with the ENS
   * Subgraph, `healReverseAddresses` should be `false`.
   */
  healReverseAddresses: boolean;

  /**
   * The network port ENSIndexer listens for http requests on, defaulting to 42069 (DEFAULT_PORT).
   *
   * Invariants:
   * - The port must be an integer between 1 and 65535
   */
  port: number;

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
}

/**
 * Describes a ponder-compatible blockrange with optional start and end blocks, minus 'latest' support.
 * An undefined start block indicates indexing from block 0, and undefined end block indicates
 * indexing in perpetuity (realtime).
 *
 * @docs https://ponder.sh/docs/contracts-and-networks#block-range
 * i.e. Pick<ContractConfig, 'startBlock' | 'endBlock'>
 */
type Blockrange = {
  startBlock?: number;
  endBlock?: number;
};
