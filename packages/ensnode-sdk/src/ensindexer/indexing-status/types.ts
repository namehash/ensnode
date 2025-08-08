import type { BlockRef, ChainId, Duration } from "../../shared";

export const ChainIndexingStatusIds = {
  Unstarted: "unstarted",
  Backfill: "backfill",
  Following: "following",
  Completed: "completed",
  IndexerError: "indexer-error",
} as const;

/**
 * ChainIndexingStatusId is the derived string union of possible Chain Indexing Status identifiers.
 */
export type ChainIndexingStatusId =
  (typeof ChainIndexingStatusIds)[keyof typeof ChainIndexingStatusIds];

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
 * Includes a startBlock, and never include an endBlock.
 */
export interface ChainIndexingIndefiniteConfig {
  /**
   * Chain indexing begins from that block.
   *
   * A chain must always have its `startBlock` defined.
   */
  startBlock: BlockRef;

  /**
   * There's never an endBlock in the indefinite config.
   */
  endBlock?: null;
}

/**
 * Chain Indexing Definite Config
 *
 * Includes a startBlock, and an endBlock.
 */
export interface ChainIndexingDefiniteConfig {
  /**
   * Chain indexing begins from that block.
   *
   * `startBlock` must always be defined.
   */
  startBlock: BlockRef;

  /**
   * Chain indexing ends at that block.
   *
   * `endBlock` must always be defined.
   */
  endBlock: BlockRef;
}

/**
 * Chain Indexing Status Config
 *
 * Configuration applied for chain indexing.
 */
export type ChainIndexingStatusConfig = ChainIndexingIndefiniteConfig | ChainIndexingDefiniteConfig;

/**
 * Chain Indexing: Unstarted status
 *
 * Notes:
 * - The "usntarted" status applies when using omnichain ordering and the
 *   overall progress checkpoint has not reached the startBlock of the chain.
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `config.endBlock` (if present)
 */
export interface ChainIndexingUnstartedStatus {
  status: typeof ChainIndexingStatusIds.Unstarted;
  config: ChainIndexingStatusConfig;
}

/**
 * Chain Indexing: Backfill status
 *
 * During a backfill, special performance optimizations are applied to
 * index all blocks between config.startBlock and backfillEndBlock
 * as fast as possible.
 *
 * Notes:
 * - The backfillEndBlock is the latest block when the process starts up.
 * - When latestIndexedBlock reaches backfillEndBlock, the backfill is complete
 *   and the status will change to "following" or "completed".
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `latestKnownBlock`
 * - `latestKnownBlock` is always the same as `backfillEndBlock`
 * - `backfillEndBlock` is always the same as `config.endBlock` (if present)
 */
export interface ChainIndexingBackfillStatus {
  status: typeof ChainIndexingStatusIds.Backfill;
  config: ChainIndexingStatusConfig;
  latestIndexedBlock: BlockRef;
  latestKnownBlock: BlockRef;
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
   * The number of seconds between `latestIndexedBlock.timestamp` and
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
 * - `latestIndexedBlock` is always the same as `latestKnownBlock`
 * - `latestKnownBlock` is always the same as `config.endBlock`
 */
export interface ChainIndexingCompletedStatus {
  status: typeof ChainIndexingStatusIds.Completed;
  config: ChainIndexingDefiniteConfig;
  latestIndexedBlock: BlockRef;
  latestKnownBlock: BlockRef;
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
 * ENSIndexer Indexing Status
 *
 * Describes the current state of indexing operations across all indexed chains.
 */
export interface ENSIndexerIndexingStatus {
  /**
   * Indexing Status for each chain.
   */
  chains: Map<ChainId, ChainIndexingStatus>;

  /**
   * Overall Indexing Status
   */
  overallStatus: Exclude<ChainIndexingStatusId, typeof ChainIndexingStatusIds.IndexerError>;

  /**
   * Approximate Realtime Distance
   */
  approximateRealtimeDistance: Duration;
}

/**
 * ENSIndexer Indexing Status Error
 *
 * Describes the state when ENSIndexer was not available.
 */
export interface ENSIndexerIndexingStatusError {
  /**
   * Overall Indexing Status
   */
  overallStatus: typeof ChainIndexingStatusIds.IndexerError;
}
