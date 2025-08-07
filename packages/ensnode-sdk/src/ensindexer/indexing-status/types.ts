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

/**
 * Chain Indexing Indefinite Config
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
 * Chain Indexing Indefinite Config
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
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `latestKnownBlock`
 * - `approximateRealtimeDistance` is always a non-negative integer value holding a duration
 */
export interface ChainIndexingFollowingStatus {
  status: typeof ChainIndexingStatusIds.Following;
  config: ChainIndexingIndefiniteConfig;
  latestIndexedBlock: BlockRef;
  latestKnownBlock: BlockRef;
  approximateRealtimeDistance: Duration;
}

/**
 * Chain Indexing: Completed status
 *
 * Notes:
 * - The "completed" status only applies when all contracts, accounts, and block intervals
 *   have a defined endBlock. This means the chain will not enter the "following" status.
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
 * Chain Indexing might be in one of many statuses.
 */
export type ChainIndexingStatus =
  | ChainIndexingUnstartedStatus
  | ChainIndexingBackfillStatus
  | ChainIndexingFollowingStatus
  | ChainIndexingCompletedStatus;

/**
 * ENSIndexer Indexing Status
 *
 * Describes the current state of the indexing operations across indexed chains.
 */
export interface ENSIndexerIndexingStatus {
  chains: Map<ChainId, ChainIndexingStatus>;
}
