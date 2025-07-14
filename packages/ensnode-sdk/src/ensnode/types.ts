import type { BlockNumber, ChainId } from "../utils/types";

/**
 * ENSNode namespace
 *
 * Includes types used across ENSNode applications, like ENSAdmin, ENSIndexer.
 */
export namespace ENSNode {
  /**
   * RPC Health
   *
   * Describes health for an RPC service.
   */
  export enum RPCHealth {
    Healthy = "RPCHealth_Healthy",
    Unhealthy = "RPCHealth_Unhealthy",
  }

  /**
   * Partial Block Info
   *
   * The smallest possible description of a block.
   */
  export interface PartialBlockInfo {
    number: BlockNumber;
  }

  /**
   * Indexing Phase
   *
   * Defines phases the indexing process can be in.
   */
  export enum IndexingPhase {
    /**
     * Both sync and indexing unstarted
     */
    SyncQueued = "IndexingPhase_SyncQueued",

    /**
     * Sync started, indexing unstarted
     */
    IndexingQueued = "IndexingPhase_IndexingQueued",

    /**
     * Both sync and indexing started
     */
    IndexingStarted = "IndexingPhase_IndexingStarted",
  }

  /**
   * Chain Status: Base type
   *
   * This type includes properties shared across other types
   * extending from the ChainStatusBase type.
   */
  export interface ChainStatusBase<
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
  > extends ChainStatusBase<IndexingPhase.SyncQueued, RpcHealthType> {
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
  > extends ChainStatusBase<IndexingPhase.IndexingQueued, RpcHealthType> {
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
  > extends ChainStatusBase<IndexingPhase.IndexingStarted, RpcHealthType> {
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

  // RPC healthy

  /**
   * RPC Healthy and Sync Queued
   */
  export type RpcHealthyAndSyncQueued<BlockType extends PartialBlockInfo> = SyncQueuedPhase<
    BlockType,
    RPCHealth.Healthy
  >;

  /**
   * RPC Healthy and Indexing Queued
   */
  export type RpcHealthyAndIndexingQueued<BlockType extends PartialBlockInfo> = IndexingQueuedPhase<
    BlockType,
    RPCHealth.Healthy
  >;

  /**
   * RPC Healthy and Indexing Started
   */
  export type RpcHealthyAndIndexingStarted<BlockType extends PartialBlockInfo> =
    IndexingStartedPhase<BlockType, RPCHealth.Healthy>;

  /**
   * Healthy Indexing Status
   *
   * Describes possible indexing status variants when RPC is healthy.
   */
  export type HealthyIndexingStatus<BlockType extends PartialBlockInfo> =
    | RpcHealthyAndSyncQueued<BlockType>
    | RpcHealthyAndIndexingQueued<BlockType>
    | RpcHealthyAndIndexingStarted<BlockType>;

  // RPC unhealthy

  /**
   * RPC Unhealthy and Sync Queued
   */
  export type RpcUnhealthyAndSyncQueued<BlockType extends PartialBlockInfo> = SyncQueuedPhase<
    BlockType,
    RPCHealth.Unhealthy
  >;

  /**
   * RPC Unhealthy and Indexing Queued
   */
  export type RpcUnhealthyAndIndexingQueued<BlockType extends PartialBlockInfo> =
    IndexingQueuedPhase<BlockType, RPCHealth.Unhealthy>;

  /**
   * RPC Unhealthy and Indexing Started
   */
  export type RpcUnhealthyAndIndexingStarted<BlockType extends PartialBlockInfo> =
    IndexingStartedPhase<BlockType, RPCHealth.Unhealthy>;

  /**
   * Unhealthy Indexing Status
   *
   * Describes possible indexing status variants when RPC is unhealthy.
   */
  export type UnhealthyIndexingStatus<BlockType extends PartialBlockInfo> =
    | RpcUnhealthyAndSyncQueued<BlockType>
    | RpcUnhealthyAndIndexingQueued<BlockType>
    | RpcUnhealthyAndIndexingStarted<BlockType>;

  /**
   * Chain status
   *
   * Describes the state of a given chain, including:
   * - RPC health
   * - Syncing progress
   * - Indexing progress
   *
   * We use a `BlockType` generic type to enable using different data model to describe a block.
   * In doing so, we support dual nature of data models: domain data models (used in domain logic) and
   * DTO data models (used for I/O operations).
   *
   * Available permutations are documented in the following file
   * `packages/ensnode-sdk/src/ensnode/chain-status-permutations.md`
   **/
  export type ChainStatus<BlockType extends PartialBlockInfo = PartialBlockInfo> =
    | HealthyIndexingStatus<BlockType>
    | UnhealthyIndexingStatus<BlockType>;
}
