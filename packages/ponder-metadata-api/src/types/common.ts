/**
 * Basic information about a block in the Ponder status.
 */
export interface PonderBlockStatus {
  /** block number if available */
  block_number: number | null;

  /** block timestamp if available */
  block_timestamp: number | null;
}

/**
 * Basic information about a block.
 */
export interface BlockInfo {
  /** block number */
  number: number;

  /** block unix timestamp */
  timestamp: number;
}

export interface NetworkIndexingStatus {
  /**
   * First block required to be indexed for the historical sync.
   */
  firstBlockToIndex: BlockInfo;

  /**
   * Closest-to-tip synced block number.
   */
  lastSyncedBlock: BlockInfo | null;

  /**
   * Last block processed & indexed by the indexer.
   */
  lastIndexedBlock: BlockInfo | null;

  /**
   * Latest safe block available on the chain.
   */
  latestSafeBlock: BlockInfo;
}
