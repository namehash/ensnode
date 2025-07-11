/**
 * ENSNode namespace: Shared types
 */
export namespace ENSNode {
  /**
   * Chain ID
   *
   * Guaranteed to be a non-negative integer.
   */
  type ChainId = number;

  /**
   * Block Number
   *
   * Guaranteed to be a non-negative integer.
   */
  type BlockNumber = number;

  /**
   * Unix timestamp
   *
   * Guaranteed to be a non-negative integer.
   */
  export type UnixTimestamp = number;

  export enum RPCHealth {
    Healthy = "RPCHealth_Healthy",
    Unhealthy = "RPCHealth_Unhealthy",
  }

  export interface PartialBlockInfo {
    number: BlockNumber;
  }

  export enum IndexingPhase {
    // both sync and indexing unstarted
    SyncQueued = "IndexingPhase_SyncQueued",
    // sync started, indexing unstarted
    IndexingQueued = "IndexingPhase_IndexingQueued",
    // both sync and indexing started
    IndexingStarted = "IndexingPhase_IndexingStarted",
  }

  export interface ChainPhaseBase<
    IndexingPhaseType extends IndexingPhase,
    RpcHealthType extends RPCHealth,
  > {
    /**
     * Chain ID
     */
    chainId: ChainId;

    /**
     * Indexing Phase
     */
    indexingPhase: IndexingPhaseType;

    /**
     * RPC Health
     */
    rpcHealth: RpcHealthType;
  }

  /**
   * Sync queued phase
   *
   * Both, Syncing RPC cache, and Indexing events have not started yet for the chain.
   */
  export interface SyncQueuedPhase<
    BlockType extends PartialBlockInfo,
    RpcHealthType extends RPCHealth,
  > extends ChainPhaseBase<IndexingPhase.SyncQueued, RpcHealthType> {
    /**
     * First block to index must be defined, at least partially.
     * It's fully defined when RPC is healthy.
     */
    firstBlockToIndex: RpcHealthType extends RPCHealth.Healthy ? BlockType : PartialBlockInfo;

    /**
     * Last synced block is not known prior syncing start.
     */
    lastSyncedBlock: null;

    /**
     * Last indexed block is not known prior indexing start.
     */
    lastIndexedBlock: null;

    /**
     * Last safe block is only known when RPC is healthy.
     */
    latestSafeBlock: RpcHealthType extends RPCHealth.Healthy ? BlockType : null;
  }

  /**
   * Indexing queued phase
   *
   * Syncing RPC cache has already started for the chain, but Indexing events has not.
   */
  export interface IndexingQueuedPhase<
    BlockType extends PartialBlockInfo,
    RpcHealthType extends RPCHealth,
  > extends ChainPhaseBase<IndexingPhase.IndexingQueued, RpcHealthType> {
    /**
     * First block to index must be fully defined.
     */
    firstBlockToIndex: BlockType;

    /**
     * Last synced block must be fully defined.
     */
    lastSyncedBlock: BlockType;

    /**
     * Last indexed block is not known prior indexing start.
     */
    lastIndexedBlock: null;

    /**
     * Last safe block is only known when RPC is healthy.
     */
    latestSafeBlock: RpcHealthType extends RPCHealth.Healthy ? BlockType : null;
  }

  /**
   * Indexing started phase
   *
   * Both, Syncing RPC cache and Indexing events have already started for the chain.
   *
   * Note: in indexing phase we assume some blocks have already
   * been available in the RPC cache, regardless of the RPC Health.
   */
  export interface IndexingStartedPhase<
    BlockType extends PartialBlockInfo,
    RpcHealthType extends RPCHealth,
  > extends ChainPhaseBase<IndexingPhase.IndexingStarted, RpcHealthType> {
    /**
     * First block to index must be fully defined.
     */
    firstBlockToIndex: BlockType;

    /**
     * Last synced block must be fully defined.
     */
    lastSyncedBlock: BlockType;

    /**
     * Last indexed block must be fully defined.
     */
    lastIndexedBlock: BlockType;

    /**
     * Last safe block is only known when RPC is healthy.
     */
    latestSafeBlock: RpcHealthType extends RPCHealth.Healthy ? BlockType : null;
  }

  export type ChainStatusPhase<
    BlockType extends PartialBlockInfo,
    RpcHealthType extends RPCHealth,
  > =
    | SyncQueuedPhase<BlockType, RpcHealthType>
    | IndexingQueuedPhase<BlockType, RpcHealthType>
    | IndexingStartedPhase<BlockType, RpcHealthType>;

  // RPC healthy

  export type RpcHealthyAndSyncQueued<BlockType extends PartialBlockInfo> = SyncQueuedPhase<
    BlockType,
    RPCHealth.Healthy
  >;
  export type RpcHealthyAndIndexingQueued<BlockType extends PartialBlockInfo> = IndexingQueuedPhase<
    BlockType,
    RPCHealth.Healthy
  >;
  export type RpcHealthyAndIndexing<BlockType extends PartialBlockInfo> = IndexingStartedPhase<
    BlockType,
    RPCHealth.Healthy
  >;

  export type HealthyIndexingStatus<BlockType extends PartialBlockInfo> =
    | RpcHealthyAndSyncQueued<BlockType>
    | RpcHealthyAndIndexingQueued<BlockType>
    | RpcHealthyAndIndexing<BlockType>;

  // RPC unhealthy

  export type RpcUnhealthyAndSyncQueued<BlockType extends PartialBlockInfo> = SyncQueuedPhase<
    BlockType,
    RPCHealth.Unhealthy
  >;
  export type RpcUnhealthyAndIndexingQueued<BlockType extends PartialBlockInfo> =
    IndexingQueuedPhase<BlockType, RPCHealth.Unhealthy>;
  export type RpcUnhealthyAndIndexing<BlockType extends PartialBlockInfo> = IndexingStartedPhase<
    BlockType,
    RPCHealth.Unhealthy
  >;

  export type UnhealthyIndexingStatus<BlockType extends PartialBlockInfo> =
    | RpcUnhealthyAndSyncQueued<BlockType>
    | RpcUnhealthyAndIndexingQueued<BlockType>
    | RpcUnhealthyAndIndexing<BlockType>;

  /**
   * Covers all ChainStatus Permutations defined via
   * https://docs.google.com/spreadsheets/d/1BresRxwVBquMftKtmdRL7aayYtwy-MN0BWQMg9aufkU/edit?gid=0#gid=0
   **/
  export type ChainStatus<BlockType extends PartialBlockInfo = PartialBlockInfo> =
    | HealthyIndexingStatus<BlockType>
    | UnhealthyIndexingStatus<BlockType>;
}

/**
 * ENSNode namespace: Domain types
 *
 * All types defined in this slice can be arbitrary.
 */
export namespace ENSNode {
  export namespace Domain {
    export type IndexingStatusKey = number;

    export interface BlockInfo extends ENSNode.PartialBlockInfo {
      createdAt: Date;
    }

    export type ChainStatus = ENSNode.ChainStatus<BlockInfo>;

    export type IndexingStatus = Map<IndexingStatusKey, ChainStatus>;
  }
}

/**
 * ENSNode namespace: DTO types
 *
 * All types defined in this slice of the {@link ENSNode} namespace
 * must be 100% compatible input for {@link JSON.stringify} function.
 *
 * They will have to cover all {@link ENSNode.Domain} types that
 * cannot be automatically serialized into a JSON string.
 */
export namespace ENSNode {
  export namespace DTO {
    export type IndexingStatusKey = string;

    export interface BlockInfo extends ENSNode.PartialBlockInfo {
      createdAt: ENSNode.UnixTimestamp;
    }

    export type ChainStatus = ENSNode.ChainStatus<BlockInfo>;

    export type IndexingStatus = { [chainId: IndexingStatusKey]: ChainStatus };
  }
}
