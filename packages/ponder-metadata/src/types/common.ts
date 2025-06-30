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
 * Ponder Status type
 *
 * It's a type of value returned by the `GET /status` endpoint on ponder server.
 *
 * Akin to:
 * https://github.com/ponder-sh/ponder/blob/8c012a3/packages/client/src/index.ts#L13-L18
 */
export interface PonderStatus {
  [chainName: string]: {
    /** @var id Chain ID */
    id: number;

    /** @var block Last Indexed Block data */
    block: BlockInfo;
  };
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
