import type { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";

export const ChainIndexingStatusIds = {
  // TODO: give each of these a value that is distinct from OmnichainIndexingStatusIds by:
  // - giving each value a prefix of "chain-..."
  Queued: "queued",
  Backfill: "backfill",
  Following: "following",
  Completed: "completed",
} as const;

/**
 * ChainIndexingStatusId is the derived string union of possible Chain Indexing Status identifiers.
 */
export type ChainIndexingStatusId =
  (typeof ChainIndexingStatusIds)[keyof typeof ChainIndexingStatusIds];

// TODO: Rename to `OmnichainIndexingStatusIds`.
export const OverallIndexingStatusIds = {
  // TODO: give each of these a value that is distinct from ChainIndexingStatusIds by:
  // - giving each value a prefix of "omnichain-..."
  Unstarted: "unstarted",
  Backfill: "backfill",
  Following: "following",
  Completed: "completed",
  // TODO: Remove the "indexer-error" status.
  IndexerError: "indexer-error",
} as const;

/**
 * OverallIndexingStatusId is the derived string union of possible Overall Indexing Status identifiers.
 */
// TODO: Rename to `OmnichainIndexingStatusId`.
export type OverallIndexingStatusId =
  (typeof OverallIndexingStatusIds)[keyof typeof OverallIndexingStatusIds];

// TODO: Rename to `ChainIndexingConfigTypeIds` to avoid confusion with the new use of "strategy".
export const ChainIndexingStrategyIds = {
  Indefinite: "indefinite",
  Definite: "definite",
} as const;

/**
 * ChainIndexingStrategyIds is the derived string union of possible Chain Indexing Strategy identifiers.
 */
// TODO: Rename to `ChainIndexingConfigTypeId` to avoid confusion with the new use of "strategy".
export type ChainIndexingStrategyId =
  (typeof ChainIndexingStrategyIds)[keyof typeof ChainIndexingStrategyIds];

/**
 * Chain Indexing Indefinite Config
 *
 * Configures a chain to be indexed for an indefinite range.
 */
// TODO: Rename to `ChainIndexingConfigIndefinite`.
export interface ChainIndexingIndefiniteConfig {
  /**
   * Chain indexing strategy.
   */
  // TODO: rename to `type`
  strategy: typeof ChainIndexingStrategyIds.Indefinite;

  /**
   * The block where indexing of the chain starts.
   *
   * An indexed chain always has its `startBlock` defined.
   */
  startBlock: BlockRef;

  /**
   * Indefinite chain indexing configs always have a null `endBlock`.
   */
  // TODO: Remove the `?` and make this field required to be `null`.
  endBlock?: null;
}

/**
 * Chain Indexing Definite Config
 *
 * Configures a chain to be indexed for a definite range.
 *
 * Invariants:
 * - `startBlock` is always before or the same as `endBlock`
 */
// TODO: Rename to `ChainIndexingConfigDefinite`.
export interface ChainIndexingDefiniteConfig {
  /**
   * Chain indexing strategy.
   */
  // TODO: rename to `type`
  strategy: typeof ChainIndexingStrategyIds.Definite;

  /**
   * The block where indexing of the chain starts.
   *
   * `startBlock` must always be defined.
   */
  startBlock: BlockRef;

  /**
   * The block where indexing of the chain ends.
   *
   * Definite chain indexing configs always have a defined `endBlock`.
   */
  endBlock: BlockRef;
}

/**
 * Chain Indexing Config
 *
 * Configuration of an indexed chain.
 */
export type ChainIndexingConfig = ChainIndexingIndefiniteConfig | ChainIndexingDefiniteConfig;

/**
 * Chain Indexing Status: Queued
 *
 * Notes:
 * - The "queued" status applies when using omnichain ordering and
 *   the omnichainIndexingCursor from the overall indexing status <= config.startBlock.timestamp.
 */
// TODO: Rename to `ChainIndexingSnapshotQueued`.
export interface ChainIndexingQueuedStatus {
  status: typeof ChainIndexingStatusIds.Queued;
  config: ChainIndexingConfig;
}

/**
 * Chain Indexing Status: Backfill
 *
 * During a backfill, special performance optimizations are applied to
 * index all blocks between config.startBlock and backfillEndBlock
 * as fast as possible.
 *
 * Notes:
 * - The backfillEndBlock is either config.endBlock (if present) or
 *   the latest block on the chain when the ENSIndexer process started up.
 *   Note how this means the backfillEndBlock is always a "fixed target".
 * - When latestIndexedBlock reaches backfillEndBlock, the backfill is complete.
 *   The moment backfill is complete the status does not immediately transition.
 *   Instead, internal processing is completed for a period of time while
 *   the status remains "backfill". After this internal processing is completed
 *   the status will change to "following" or "completed" depending on
 *   the configured indexing strategy. If the strategy is indefinite,
 *   changes to "following", else if the strategy is definite, changes to
 *   "completed".
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `backfillEndBlock`
 * - `backfillEndBlock` is the same as `config.endBlock` if and only if
 *   the config is definite.
 */
// TODO: Rename to `ChainIndexingSnapshotBackfill`.
export interface ChainIndexingBackfillStatus {
  status: typeof ChainIndexingStatusIds.Backfill;
  config: ChainIndexingConfig;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;

  /**
   * The block that is the target for finishing the backfill.
   */
  backfillEndBlock: BlockRef;
}

/**
 * Chain Indexing Status: Following
 *
 * Following occurs after the backfill of a chain is completed and represents
 * the process of indefinitely following (and indexing!) new blocks as they are
 * added to the indexed chain across time.
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `latestKnownBlock`
 */
// TODO: Rename to `ChainIndexingSnapshotFollowing`.
export interface ChainIndexingFollowingStatus {
  status: typeof ChainIndexingStatusIds.Following;

  config: ChainIndexingIndefiniteConfig;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;

  /**
   * The "highest" block that has been fetched by RPC calls and stored in
   * the RPC cache as part of the indexing process.
   */
  latestKnownBlock: BlockRef;

  /**
   * The number of seconds between `latestIndexedBlock.timestamp` and
   * the current time in ENSIndexer. This represents the upper-bound worst case
   * distance approximation between the latest block on the chain (independent
   * of it becoming known to us) and the latest block that has completed
   * indexing. The true distance to the latest block on the chain will be less
   * if the latest block on the chain was not issued at the current second.
   */
  // TODO: This field needs to be removed because it incorporates an implicit reference with "now". Is there any special issue if we remove this field?
  approxRealtimeDistance: Duration;
}

/**
 * Chain Indexing Status: Completed
 *
 * Indexing of a chain is completed after the backfill when the chain is
 * not configured to be indefinitely indexed.
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always the same as `config.endBlock`.
 */
// TODO: Rename to `ChainIndexingSnapshotCompleted`.
export interface ChainIndexingCompletedStatus {
  status: typeof ChainIndexingStatusIds.Completed;
  config: ChainIndexingDefiniteConfig;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;
}

/**
 * Chain Indexing Status
 *
 * Use the `status` field to determine the correct type interpretation at runtime.
 */
// TODO: Rename to `ChainIndexingSnapshot`
export type ChainIndexingStatus =
  | ChainIndexingQueuedStatus
  | ChainIndexingBackfillStatus
  | ChainIndexingFollowingStatus
  | ChainIndexingCompletedStatus;

/**
 * ENSIndexer Overall Indexing Status: Unstarted
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the overall indexing status is {@link OverallIndexingStatusIds.Unstarted}.
 */
// TODO: Rename to `OmnichainIndexingSnapshotUnstarted`.
export interface ENSIndexerOverallIndexingUnstartedStatus {
  /**
   * Overall Indexing Status
   */
  // TODO: Rename to `omnichainStatus`.
  overallStatus: typeof OverallIndexingStatusIds.Unstarted;

  /**
   * Indexing Status for each chain.
   *
   * Each chain is guaranteed to have the "queued" status.
   * It's impossible for any chain to have status other than "queued".
   */
  chains: Map<ChainId, ChainIndexingQueuedStatus>;

  // TODO: Add omnichainIndexingCursor which is the lowest start block timestamp of all queued chains - 1.
}

/**
 * Chain Indexing Status allowed when overall status is 'backfill'.
 */
export type ChainIndexingStatusForBackfillOverallStatus =
  | ChainIndexingQueuedStatus
  | ChainIndexingBackfillStatus
  | ChainIndexingCompletedStatus;

/**
 * ENSIndexer Overall Indexing Status: Backfill
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the overall indexing status is {@link OverallIndexingStatusIds.Backfill}.
 */
// TODO: Rename to `OmnichainIndexingSnapshotBackfill`.
export interface ENSIndexerOverallIndexingBackfillStatus {
  /**
   * Overall Indexing Status
   */
  // TODO: Rename to `omnichainStatus`.
  overallStatus: typeof OverallIndexingStatusIds.Backfill;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all indexed chains.
   *
   * Invariants:
   * - guaranteed to be equal to
   *   the timestamp of the highest `latestIndexedBlock` across all chains that
   *   have started indexing (are not queued).
   * - guaranteed to be lower than
   *   the `config.startBlock` timestamp for all queued chains.
   */
  // TODO: The order that we define fields across these types should always be:
  // 1. overallStatus
  // 2. chains
  // 3. omnichainIndexingCursor
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Indexing Status for each chain.
   *
   * At least one chain is guaranteed to be in the "backfill" status.
   * Each chain is guaranteed to have a status of either "queued",
   * "backfill" or "completed". It's impossible for any chain to be
   * in the "following" status.
   */
  chains: Map<ChainId, ChainIndexingStatusForBackfillOverallStatus>;
}

/**
 * ENSIndexer Overall Indexing Status: Completed
 *
 * Describes the final state of indexing operations across all indexed chains
 * when all indexed chains are configured for a definite indexing strategy and
 * all indexing of that definite range is completed.
 */
// TODO: Rename to `OmnichainIndexingSnapshotCompleted`.
// TODO: Move the definition of "...completed" after the definition of "...following".
export interface ENSIndexerOverallIndexingCompletedStatus {
  /**
   * Overall Indexing Status
   */
  // TODO: Rename to `omnichainStatus`.
  overallStatus: typeof OverallIndexingStatusIds.Completed;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all indexed chains.
   *
   * Invariants:
   * - guaranteed to be equal to
   *   the timestamp of the highest `latestIndexedBlock` across all chains that
   *   have started indexing (are not queued).
   * - guaranteed to be lower than
   *   the `config.startBlock` timestamp for all queued chains.
   */
  // TODO: The order that we define fields across these types should always be:
  // 1. overallStatus
  // 2. chains
  // 3. omnichainIndexingCursor
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Indexing Status for each chain.
   *
   * Each chain is guaranteed to have the "completed" status.
   * It's impossible for any chain to have status other than "completed".
   */
  chains: Map<ChainId, ChainIndexingCompletedStatus>;
}

/**
 * ENSIndexer Overall Indexing Status: Following
 *
 * Describes the state when the overall indexing status is
 * {@link OverallIndexingStatusIds.Following}.
 */
// TODO: Rename to `OmnichainIndexingSnapshotFollowing`.
export interface ENSIndexerOverallIndexingFollowingStatus {
  /**
   * Overall Indexing Status
   */
  // TODO: Rename to `omnichainStatus`.
  overallStatus: typeof OverallIndexingStatusIds.Following;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all indexed chains.
   *
   * Invariants:
   * - guaranteed to be equal to
   *   the timestamp of the highest `latestIndexedBlock` across all chains that
   *   have started indexing (are not queued).
   * - guaranteed to be lower than
   *   the `config.startBlock` timestamp for all queued chains.
   */
  // TODO: The order that we define fields across these types should always be:
  // 1. overallStatus
  // 2. chains
  // 3. omnichainIndexingCursor
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Indexing Status for each chain.
   *
   * At least one chain is guaranteed to be in the "following" status.
   * Each chain is guaranteed to have a status of either "queued",
   * "backfill", "following" or "completed".
   */
  chains: Map<ChainId, ChainIndexingStatus>;

  // TODO: This comment applies to ALL omnichain snapshots, not just "following":
  // Suggest to add another field here named `snapshotTime` of type `UnixTimestamp`.
  // This field should have an invariant that `snapshotTime` is >= `omnichainIndexingCursor`,
  // and is >= `latestKnownBlock` for any "following" chains.
  // The value in this field represents the timestamp when the snapshot was generated.
  // Due to possible clock skew between systems, when generating the value that you put in this field,
  // it should be set as the max between the system timestamp in ENSIndexer and `omnichainIndexingCursor`
  // and `latestKnownBlock`.
  // Goals of this field include helping us identify the distinction between the "current" distance vs
  // the "snapshot" distance. This is highly relevant for cases where "snapshots" are planned to be cached
  // in memory or stored in ENSDb.
}

/**
 * ENSIndexer Overall Indexing Status: Error
 *
 * Describes the state when ENSIndexer failed to return the indexing status for
 * all indexed chains.
 *
 * This state suggests an error with the "primary" ENSIndexer.
 */
// TODO: Completely remove ENSIndexerOverallIndexingErrorStatus. It should be replaced by CurrentIndexingStatusError.
export interface ENSIndexerOverallIndexingErrorStatus {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.IndexerError;
}

/**
 * ENSIndexer Overall Indexing Status
 *
 * Describes the overall state of indexing operations.
 */
// TODO: Rename to `OmnichainIndexingSnapshot`.
export type ENSIndexerOverallIndexingStatus =
  | ENSIndexerOverallIndexingUnstartedStatus
  | ENSIndexerOverallIndexingBackfillStatus
  | ENSIndexerOverallIndexingCompletedStatus
  | ENSIndexerOverallIndexingFollowingStatus
  | ENSIndexerOverallIndexingErrorStatus;


/**
 * Max realtime distance response
 */
export type MaxRealtimeDistanceResponse = {
  /**
   * Requested max realtime distance.
   */
  request: Duration;

  /**
   * Identifies if the requested max realtime distance is satisfied.
   */
  isSatisfied: boolean;
};

/**
 * Max realtime distance response that is guaranteed to be unsatisfied.
 */
export type MaxRealtimeDistanceResponseUnsatisfied = {
  /**
   * Requested max realtime distance.
   */
  request: Duration;

  /**
   * Identifies if the requested max realtime distance is satisfied.
   * 
   * Guaranteed to be false.
   */
  isSatisfied: false;
};

export const IndexingStrategyIds = {
  Omnichain: "omnichain",
} as const;

export type IndexingStrategyIds =
  (typeof IndexingStrategyIds)[keyof typeof IndexingStrategyIds];

// NOTE:
// - This is "Current..." because it isthe only place in the indexing status data model that should have a relationship with "now".
// - This adds an explicit "realtime" timestamp
// - The above is important as we want to be able to cache `OmnichainIndexingSnapshot` and then generate
//   - `CurrentIndexingProjectionOmnichain` as a function of:
//      - An omnichain indexing snapshot (from cache)
//      - "now" (aka "realtime")
//      - `maxRealtimeDistance` (as might be associated the request being processed)
// - This also includes an explicit field for `strategy` which provides more "future-proofing" and explicitly
//   identifies how this data model is specific to omnichain indexing -- the data model and invariants would be
//   different for other indexing strategies.
export type CurrentIndexingProjectionOmnichain = {
  strategy: typeof IndexingStrategyIds.Omnichain;

  // the timestamp approximating "realtime" that relative distances are calculated from
  // must always be >= `snapshotTime`
  // due to possible clock skew between systems, when generating the value that you put in this field,
  // it should be set as the max between the system timestamp in ENSIndexer and `snapshotTime`.
  realtime: UnixTimestamp;

  /**
   * The maximum
   * {@link ChainIndexingFollowingStatus.approxRealtimeDistance} value
   * across all chains with status: 'following'.
   */
  // TODO: Update the docs for this field. Previously this field only existed for the "following" omnichain status. It should exist for all omnichain statuses.
  // TODO: Rename to `maxRealtimeDistance`.
  overallApproxRealtimeDistance: Duration;

  /**
   * Max realtime indexing distance response.
   * 
   * Defined if and only if a max realtime distance request was made.
   *
   * If defined, describes the max realtime distance request and its associated response.
   */
  // TODO: I'm thinking we can remove this field (and the `MaxRealtimeDistanceResponse` type) because it's
  // trivial for clients to just check the `maxRealtimeDistance` field in the response.
  // Likewise, we can remove the optional `maxRealtimeDistance` param in the request.
  maxRealtimeDistanceResponse?: MaxRealtimeDistanceResponse;

  snapshot: ENSIndexerOverallIndexingStatus;
}

export type CurrentIndexingProjectionError = {
  // strategy is unknown because indexer is unavailable
  strategy: null;

  // the timestamp for "realtime" that relative distances are calculated from
  realtime: UnixTimestamp;

  // maxRealtimeDistance is unknown because indexer is unavailable
  maxRealtimeDistance: null;

  /**
   * Max realtime indexing distance response.
   * 
   * Defined if and only if a max realtime distance request was made.
   *
   * If defined, describes the max realtime distance request and its associated response
   * (which is always unsatisfied in the case of an indexer error).
   */
  // TODO: I'm thinking we can remove this field (and the `MaxRealtimeDistanceResponseUnsatisfied` type) because it's
  // trivial for clients to just check the `maxRealtimeDistance` field in the response.
  // Likewise, we can remove the optional `maxRealtimeDistance` param in the request.
  maxRealtimeDistanceResponse?: MaxRealtimeDistanceResponseUnsatisfied;

  // snapshot is unknown because indexer is unavailable
  snapshot: null;
}

export type CurrentIndexingProjection = CurrentIndexingProjectionOmnichain | CurrentIndexingProjectionError;
