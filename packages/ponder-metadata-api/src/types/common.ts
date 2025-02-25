export interface BlockMetadata {
  height: number;
  timestamp: number;
  utc: string;
}

export interface NetworkIndexingStatus {
  /**
   * Number of blocks required for the historical sync.
   */
  totalBlocksCount: number | null;

  /**
   *  Number of blocks that were found in the cache for the historical sync.
   */
  cachedBlocksCount: number | null;

  /**
   * Closest-to-tip synced block number.
   */
  lastSyncedBlock: BlockMetadata | null;

  /**
   * Last block processed & indexed by the indexer.
   */
  lastIndexedBlock: BlockMetadata | null;

  /**
   * Latest safe block available on the chain.
   */
  latestSafeBlock: BlockMetadata | null;

  /**
   * Indicating if the sync is realtime mode.
   */
  isRealtime: boolean;

  /**
   * Indicating if the sync has synced all blocks up to the tip.
   */
  isComplete: boolean;

  /**
   * Indicating if the sync is queued.
   */
  isQueued: boolean;
}
