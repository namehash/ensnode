import type { ENSNamespaceId } from "../../ens";
import type { ChainId } from "../../shared";

/**
 * A PluginName is a unique id for a 'plugin': we use the notion of
 * 'plugins' to describe bundles of indexing logic.
 */
export enum PluginName {
  Subgraph = "subgraph",
  Basenames = "basenames",
  Lineanames = "lineanames",
  ThreeDNS = "threedns",
  ReverseResolvers = "reverse-resolvers",
  Referrals = "referrals",
}

/**
 * Information about ENSIndexer's dependencies.
 */
export interface DependencyInfo {
  /** Node.js runtime version */
  nodejs: string;

  /** Ponder framework version */
  ponder: string;

  /** ENSRainbow service version */
  ensRainbow: string;

  /** ENSRainbow schema version */
  ensRainbowSchema: number;
}

/**
 * Complete public configuration object for ENSIndexer.
 *
 * We use parameter types to maintain fields layout and documentation across
 * the domain model and its serialized counterpart.
 */
export interface ENSIndexerPublicConfig {
  /**
   * The ENS namespace that ENSNode operates in the context of.
   *
   * See {@link ENSNamespaceIds} for available namespace identifiers.
   */
  namespace: ENSNamespaceId;

  /**
   * An ENSAdmin URL
   *
   * The ENSNode root api route `/` redirects to {@link ensAdminUrl},
   * configuring ENSAdmin with an entry for this instance of ENSNode,
   * identified by {@link ensNodePublicUrl}.
   *
   * @see https://ensnode.io/ensadmin/overview/what-is-ensadmin
   */
  ensAdminUrl: URL;

  /**
   * The publicly accessible endpoint of the ENSNode API
   * (ex: http://localhost:42069).
   *
   * ENSAdmin will use this url to connect to the ENSNode api for querying
   * state about the ENSNode instance.
   */
  ensNodePublicUrl: URL;

  /**
   * A Postgres database schema name. This instance of ENSIndexer will write
   * indexed data to the tables in this schema.
   *
   * Invariants:
   * - Must be a non-empty string that is a valid Postgres database schema
   *   identifier.
   */
  databaseSchemaName: string;

  /**
   * A set of {@link PluginName}s indicating which plugins to activate.
   *
   * Invariants:
   * - A set of valid {@link PluginName}s with at least one value
   */
  plugins: PluginName[];

  /**
   * Enable or disable healing of addr.reverse subnames.
   * If this is set to true, ENSIndexer will attempt to heal subnames of
   * addr.reverse.
   */
  healReverseAddresses: boolean;

  /**
   * Enable or disable the indexing of Resolver record values.
   * If this is set to false, ENSIndexer will apply subgraph-backwards
   * compatible logic that only tracks the keys of Resolver records.
   * If this is set to true, ENSIndexer will track both the keys and the values
   * of Resolver records.
   *
   * WARNING: Special care must be taken when interacting with indexed resolver
   * record values. It is unsafe to naively assume that indexed resolver record
   * values are equivalent to the resolver record values that would be returned
   * through dynamic lookups via the ENS protocol. For example, if a resolver
   * implements CCIP-Read, the resolver records may not be discoverable through
   * onchain indexing. This feature is under R&D. At this time we do not
   * recommend anyone directly use indexed resolver record values in their
   * applications. Features are planned in the ENSNode roadmap that will
   * provide safe use of indexed resolver record values (in appropriate
   * contexts).
   *
   * Note that enabling {@link indexAdditionalResolverRecords} results in
   * indexed data becoming a _superset_ of the Subgraph. For exact data-level
   * backwards compatibility with the ENS Subgraph,
   * {@link indexAdditionalResolverRecords} should be `false`.
   */
  indexAdditionalResolverRecords: boolean;

  /**
   * Experiment to enable forward/reverse resolution APIs.
   */
  experimentalAcceleration: boolean;

  /**
   * Indexed Chain IDs
   *
   * Includes the {@link ChainId} for each chain being indexed.
   */
  indexedChainIds: Set<ChainId>;

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

  /**
   * Information about the ENSIndexer instance dependencies.
   */
  dependencyInfo: DependencyInfo;
}
