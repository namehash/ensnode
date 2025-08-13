import type { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";

export const ChainIndexingStatusIds = {
  Unstarted: "unstarted",
  Backfill: "backfill",
  Following: "following",
  Completed: "completed",
} as const;

/**
 * ChainIndexingStatusId is the derived string union of possible Chain Indexing Status identifiers.
 */
export type ChainIndexingStatusId =
  (typeof ChainIndexingStatusIds)[keyof typeof ChainIndexingStatusIds];

export const OverallIndexingStatusIds = {
  Unstarted: "unstarted",
  Backfill: "backfill",
  Following: "following",
  Completed: "completed",
  IndexerError: "indexer-error",
} as const;

/**
 * OverallIndexingStatusId is the derived string union of possible Overall Indexing Status identifiers.
 */
export type OverallIndexingStatusId =
  (typeof OverallIndexingStatusIds)[keyof typeof OverallIndexingStatusIds];

export const ChainIndexingStrategyIds = {
  Indefinite: "indefinite",
  Definite: "definite",
} as const;

/**
 * ChainIndexingStrategyIds is the derived string union of possible Chain Indexing Strategy identifiers.
 */
export type ChainIndexingStrategyId =
  (typeof ChainIndexingStrategyIds)[keyof typeof ChainIndexingStrategyIds];

/**
 * Chain Indexing Indefinite Config
 *
 * Configures a chain to be indexed for an indefinite range.
 */
export interface ChainIndexingIndefiniteConfig {
  /**
   * Chain indexing strategy.
   */
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
export interface ChainIndexingDefiniteConfig {
  /**
   * Chain indexing strategy.
   */
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
 * Chain Indexing Status: Unstarted
 *
 * Notes:
 * - The "unstarted" status applies when using omnichain ordering and
 *   the omnichainIndexingCursor has not reached the startBlock of the chain.
 */
export interface ChainIndexingUnstartedStatus {
  status: typeof ChainIndexingStatusIds.Unstarted;
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
export interface ChainIndexingBackfillStatus {
  status: typeof ChainIndexingStatusIds.Backfill;
  config: ChainIndexingConfig;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;

  /**
   * The block after which the backfill will be finished.
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
export interface ChainIndexingFollowingStatus {
  status: typeof ChainIndexingStatusIds.Following;

  config: ChainIndexingIndefiniteConfig;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;

  /**
   * The block that was most recently fetched from chain into the RPC cache
   * so it could be indexed.
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
export type ChainIndexingStatus =
  | ChainIndexingUnstartedStatus
  | ChainIndexingBackfillStatus
  | ChainIndexingFollowingStatus
  | ChainIndexingCompletedStatus;

/**
 * Chain Indexing Status: Active
 *
 * Represents a chain for which indexing is happening currently.
 * The `latestIndexedBlock` field applies in that status.
 */
export type ChainIndexingActiveStatus = ChainIndexingBackfillStatus | ChainIndexingFollowingStatus;

/**
 * Chain Indexing Status: Standby
 *
 * Represents a chain for which no indexing is happening at the moment.
 * The `latestIndexedBlock` field is not applicable in that status.
 */
export type ChainIndexingStandbyStatus =
  | ChainIndexingUnstartedStatus
  | ChainIndexingCompletedStatus;

/**
 * Chain Indexing Status allowed when overall status is 'unstarted'.
 */
export type ChainIndexingStatusForUnstartedOverallStatus =
  | ChainIndexingUnstartedStatus
  | ChainIndexingCompletedStatus;

/**
 * ENSIndexer Overall Indexing Status: Backfill
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the overall indexing status is {@link OverallIndexingStatusIds.Unstarted}.
 */
export interface ENSIndexerOverallIndexingUnstartedStatus {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Unstarted;

  /**
   * Indexing Status for each chain.
   *
   * At least one chain is guaranteed to be in the "unstarted" status.
   * Each chain is guaranteed to have a status of either "unstarted",
   * or "completed". It's impossible for any chain to have a status of either
   * "backfill", or "following".
   */
  chains: Map<ChainId, ChainIndexingStatusForUnstartedOverallStatus>;
}

/**
 * Chain Indexing Status allowed when overall status is 'backfill'.
 */
export type ChainIndexingStatusForBackfillOverallStatus =
  | ChainIndexingUnstartedStatus
  | ChainIndexingBackfillStatus
  | ChainIndexingCompletedStatus;

/**
 * ENSIndexer Overall Indexing Status: Backfill
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the overall indexing status is {@link OverallIndexingStatusIds.Backfill}.
 */
export interface ENSIndexerOverallIndexingBackfillStatus {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Backfill;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all chains in {@link ChainIndexingBackfillStatus} status.
   *
   * Invariants:
   * - the cursor value is guaranteed to be lower than or equal to
   *   the timestamp of the earliest `config.startBlock` across all chains
   *   in {@link ChainIndexingStandbyStatus} status.
   */
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Indexing Status for each chain.
   *
   * At least one chain is guaranteed to be in the "backfill" status.
   * Each chain is guaranteed to have a status of either "unstarted",
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
export interface ENSIndexerOverallIndexingCompletedStatus {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Completed;

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
export interface ENSIndexerOverallIndexingFollowingStatus {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Following;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all chains in {@link ChainIndexingActiveStatus} status.
   *
   * Invariants:
   * - the cursor value is guaranteed to be lower than or equal to
   *   the timestamp of the earliest `config.startBlock` across all chains
   *   in {@link ChainIndexingStandbyStatus} status.
   */
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Indexing Status for each chain.
   */
  chains: Map<ChainId, ChainIndexingStatus>;

  /**
   * The maximum
   * {@link ChainIndexingFollowingStatus.approxRealtimeDistance} value
   * across all chains with status: 'following'.
   */
  overallApproxRealtimeDistance: Duration;
}

/**
 * ENSIndexer Overall Indexing Status: Error
 *
 * Describes the state when ENSIndexer failed to return the indexing status for
 * all indexed chains.
 *
 * This state suggests an error with the "primary" ENSIndexer.
 */
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
export type ENSIndexerOverallIndexingStatus =
  | ENSIndexerOverallIndexingUnstartedStatus
  | ENSIndexerOverallIndexingBackfillStatus
  | ENSIndexerOverallIndexingCompletedStatus
  | ENSIndexerOverallIndexingFollowingStatus
  | ENSIndexerOverallIndexingErrorStatus;
