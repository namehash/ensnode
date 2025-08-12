import type { BlockRef, ChainId, Duration } from "../../shared";

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
  indexingStrategy: typeof ChainIndexingStrategyIds.Indefinite;

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
  indexingStrategy: typeof ChainIndexingStrategyIds.Definite;

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
 * Chain Indexing: Unstarted status
 *
 * Notes:
 * - The "unstarted" status applies when using omnichain ordering and the
 *   overall progress checkpoint has not reached the startBlock of the chain.
 */
export interface ChainIndexingUnstartedStatus {
  status: typeof ChainIndexingStatusIds.Unstarted;
  config: ChainIndexingConfig;
}

/**
 * Chain Indexing: Backfill status
 *
 * During a backfill, special performance optimizations are applied to
 * index all blocks between config.startBlock and backfillEndBlock
 * as fast as possible.
 *
 * Notes:
 * - The backfillEndBlock is either config.endBlock (if present) or
 *   the latest block on the chain when the ENSIndexer process started up.
 *   Note how this means the backfillEndBlock is always a "fixed target".
 * - After latestIndexedBlock reached backfillEndBlock, the backfill is complete.
 *   The status will change to "following" or "completed" depending on
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
  latestIndexedBlock: BlockRef;
  backfillEndBlock: BlockRef;
}

/**
 * Chain Indexing: Following status
 *
 * Following occurs after the backfill of a chain is completed and represents
 * the process of indefinitely following (and indexing!) new blocks as they are
 * added to the indexed chain across time.
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `latestKnownBlock`
 * - `approximateRealtimeDistance` is always a non-negative integer
 */
export interface ChainIndexingFollowingStatus {
  status: typeof ChainIndexingStatusIds.Following;

  config: ChainIndexingIndefiniteConfig;

  latestIndexedBlock: BlockRef;

  latestKnownBlock: BlockRef;

  /**
   * The highest number of seconds between `latestIndexedBlock.timestamp` and
   * the current time in ENSIndexer. This represents the upper-bound worst case
   * distance approximation between the latest block on the chain (independent
   * of it becoming known to us) and the latest block that has completed
   * indexing. The true distance to the latest block on the chain will be less
   * if the latest block on the chain was not issued at the current second.
   */
  approximateRealtimeDistance: Duration;
}

/**
 * Chain Indexing: Completed status
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
 * ENSIndexer Overall Indexing Status: Backfill
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the overall indexing status is {@link OverallIndexingStatusIds.Backfill}.
 */
export interface ENSIndexerOverallIndexingStatusBackfill {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Backfill;

  /**
   * Indexing Status for each chain.
   */
  chains: Map<ChainId, ChainIndexingStatus>;
}

/**
 * ENSIndexer Overall Indexing Status: Completed
 *
 * Describes the final state of indexing operations across all indexed chains
 * when the overall indexing status is {@link OverallIndexingStatusIds.Completed}.
 */
export interface ENSIndexerOverallIndexingStatusCompleted {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Completed;

  /**
   * Indexing Status for each chain.
   *
   * All chains are in
   * the {@link OverallIndexingStatusIds.Completed} status by now.
   */
  chains: Map<ChainId, ChainIndexingStatus>;
}

/**
 * ENSIndexer Overall Indexing Status: Following
 *
 * Describes the state when the overall indexing status is
 * {@link OverallIndexingStatusIds.Following}.
 */
export interface ENSIndexerOverallIndexingStatusFollowing {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.Following;

  /**
   * Indexing Status for each chain.
   */
  chains: Map<ChainId, ChainIndexingStatus>;

  /**
   * The maximum
   * {@link ChainIndexingFollowingStatus.approximateRealtimeDistance} value
   * across all chains with the 'following' status.
   */
  maxApproximateRealtimeDistance: Duration;
}

/**
 * ENSIndexer Overall Indexing Status: Error
 *
 * Describes the state when ENSIndexer failed to return the indexing status for
 * all indexed chains. This state suggests an error with ENSIndexer.
 */
export interface ENSIndexerOverallIndexingStatusError {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof OverallIndexingStatusIds.IndexerError;
}

/**
 * ENSIndexer Overall Indexing Status
 *
 * Describes the current state of indexing operations if possible.
 * Otherwise, presents the error status.
 */
export type ENSIndexerOverallIndexingStatus =
  | ENSIndexerOverallIndexingStatusBackfill
  | ENSIndexerOverallIndexingStatusCompleted
  | ENSIndexerOverallIndexingStatusFollowing
  | ENSIndexerOverallIndexingStatusError;
