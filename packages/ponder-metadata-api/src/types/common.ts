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

/**
 * Network indexing status for a chain.
 */
export interface NetworkIndexingStatus {
  /**
   * First block required to be indexed during the historical sync.
   */
  firstBlockToIndex: BlockInfo;

  /**
   * Latest block synced into indexer's RPC cache.
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

/**
 * ENSRainbow version information.
 */
export interface EnsRainbowVersionInfo {
  /**
   * ENSRainbow version.
   */
  version: string;

  /**
   * ENSRainbow schema version.
   */
  schema_version: number;
}
