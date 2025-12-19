/**
 * Chain ID
 *
 * Represents a unique identifier for a chain.
 * Guaranteed to be a positive integer.
 **/
export type ChainId = number;

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = number;

/**
 * Unix timestamp value
 *
 * Represents the number of seconds that have elapsed
 * since January 1, 1970 (midnight UTC/GMT).
 *
 * Guaranteed to be an integer. May be zero or negative to represent a time at or
 * before Jan 1, 1970.
 */
export type UnixTimestamp = number;

/**
 * BlockRef
 *
 * Describes a block.
 *
 * We use parameter types to maintain fields layout and documentation across
 * the domain model and its serialized counterpart.
 */
export interface BlockRef {
  /** Block number (height) */
  number: BlockNumber;

  /** Block timestamp */
  timestamp: UnixTimestamp;
}

/*
 * Ponder Status type
 *
 * It's a type of value returned by the `GET /status` endpoint on ponder server.
 *
 * Akin to:
 * https://github.com/ponder-sh/ponder/blob/8c012a3/packages/client/src/index.ts#L13-L18
 */
export interface PonderStatus {
  [chainName: string]: {
    /** Chain ID */
    id: ChainId;

    /** Latest Indexed Block Ref */
    block: BlockRef;
  };
}

/**
 * Indexing status for a chain.
 */
export interface ChainIndexingStatus {
  /** Chain ID of the indexed chain */
  chainId: ChainId;

  /**
   * First block required to be indexed during the historical sync.
   */
  firstBlockToIndex: BlockRef;

  /**
   * Latest block synced into indexer's RPC cache.
   */
  lastSyncedBlock: BlockRef | null;

  /**
   * Last block processed & indexed by the indexer.
   */
  lastIndexedBlock: BlockRef | null;

  /**
   * Latest safe block available on the chain.
   */
  latestSafeBlock: BlockRef;
}
