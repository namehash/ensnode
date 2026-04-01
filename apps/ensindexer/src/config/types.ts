import type { ENSNamespaceId } from "@ensnode/datasources";
import type { BlockNumberRange, ChainId, PluginName } from "@ensnode/ensnode-sdk";
import {
  type DatabaseUrl,
  type EnsIndexerSchemaName,
  RpcConfig,
  type RpcConfigs,
} from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbowClientLabelSet } from "@ensnode/ensrainbow-sdk";

/**
 * The complete runtime configuration for an ENSIndexer instance.
 */
export interface EnsIndexerConfig {
  /**
   * The ENS namespace that ENSNode operates in the context of.
   *
   * See {@link ENSNamespaceIds} for available namespace identifiers.
   */
  namespace: ENSNamespaceId;

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
   * The name of the ENSIndexer Schema in ENSDb where ENSIndexer will create
   * tables to store indexed data.
   *
   * Each ENSIndexer instance is the exclusive writer to its ENSIndexer Schema
   * within an ENSDb. Therefore, {@link ensIndexerSchemaName} must be
   * a unique ENSIndexer Schema Name for all ENSIndexer instances writing to
   * the same ENSDb. Multiple ENSIndexer instances can write to the same ENSDb,
   * but each requires a distinct ENSIndexer Schema Name.
   *
   * When ENSIndexer runs in production mode, the following rules apply:
   * - For safety, any changes to the indexing behavior in ENSIndexer (including
   *   any changes to indexing code or any changes to environment variables that
   *   influence indexing behavior) will cause ENSIndexer to refuse to use
   *   an ENSIndexer Schema that was already built with different indexing behavior.
   *   This is to prevent data corruption from multiple ENSIndexer instances writing
   *   state to the same ENSIndexer Schema at the same time.
   * - If you wish to change the indexing behavior of your ENSIndexer (such as
   *   upgrading to a new ENSIndexer version or changing environment variables
   *   that influence indexing behavior) you must either:
   *   - Configure a new ENSIndexer Schema Name
   *   - Remove or rename the existing ENSIndexer Schema you previously built
   * - Each time you configure a new ENSIndexer Schema Name there is
   *   no automatic "garbage collection" of any ENSIndexer Schemas you may have
   *   previously built. Over time, this can result in the consumption of more and
   *   more storage space consumption. To solve for this, manually garbage collect
   *   any ENSIndexer Schemas you have previously built when they are
   *   no longer needed.
   * - If ENSIndexer restarts without changes in the indexing behavior,
   *   the indexing will continue from where it left off.
   *
   * When ENSIndexer runs in dev mode, the following rules apply:
   * - Any change to indexing behavior in ENSIndexer results in the ENSIndexer instance being restarted.
   * - Each time ENSIndexer starts in dev mode, the ENSIndexer Schema for
   *   the {@link ensIndexerSchemaName} is recreated. This means that any existing ENSIndexer Schema with
   *   the {@link ensIndexerSchemaName} will be dropped and a new ENSIndexer Schema with the same name will be created.
   *
   * ENSIndexer manages the ENSIndexer Schemas according to the rules of Ponder-managed database schemas.
   * Read more about these rules here:
   * @see https://ponder.sh/docs/api-reference/ponder/database#database-schema-rules
   *
   * Invariants:
   * - Must be a non-empty string that is a valid Postgres database schema identifier.
   */
  ensIndexerSchemaName: EnsIndexerSchemaName;

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
   * Configuration for each indexable RPC, keyed by chain id.
   *
   * Invariants:
   * - Each value in {@link indexedChainIds} is guaranteed to
   *   have its {@link RpcConfig} included here.
   * - Note: There may be some {@link RpcConfig} values preset for
   *   chain IDs that are not included in {@link indexedChainIds}. In other words, the keys
   *   of {@link rpcConfigs} is a superset of {@link indexedChainIds}.
   */
  rpcConfigs: RpcConfigs;

  /**
   * Indexed Chain IDs
   *
   * Includes the {@link ChainId} for each chain being indexed.
   */
  indexedChainIds: Set<ChainId>;

  /**
   * The Postgres connection string for the ENSDb instance the ENSIndexer instance will use.
   *
   * Invariants:
   * - The URL must be a valid PostgreSQL connection string
   */
  ensDbUrl: DatabaseUrl;

  /**
   * Constrains the global blockrange for indexing, useful for testing purposes.
   *
   * This is strictly designed for testing and development and its usage in production will result
   * in incorrect or out-of-date indexes.
   *
   * ENSIndexer will constrain all indexed contracts to the provided {@link BlockNumberRange.startBlock}
   * and {@link BlockNumberRange.endBlock} if specified.
   *
   * Invariants:
   * - both `startBlock` and `endBlock` are optional, and expected to be undefined
   * - if defined, startBlock must be an integer greater than 0
   * - if defined, endBlock must be an integer greater than 0
   * - if defined, endBlock must be greater than startBlock
   * - if either `startBlock` or `endBlock` are defined, the number of indexed chains described
   *   by {@link plugins} must be 1
   */
  globalBlockrange: BlockNumberRange;

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
 * The complete runtime configuration for an ENSIndexer instance.
 *
 * @deprecated Use {@link EnsIndexerConfig} instead.
 */
export type ENSIndexerConfig = EnsIndexerConfig;
