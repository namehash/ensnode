/**
 * Ponder Metadata: Chains
 *
 * This file describes ideas and functionality related to metadata about chains
 * indexing status. In this module, ideas represented in other Ponder Metadata
 * modules, such as:
 * - Config
 * - Metrics
 * - RPC
 * - Status
 * all come together to form a single view about a chain's indexing status.
 */

import {
  type BlockRef,
  type ChainId,
  type ChainIdString,
  ChainIndexingConfigTypeIds,
  type ChainIndexingSnapshot,
  type ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill,
  ChainIndexingStatusIds,
  type DeepPartial,
  type OmnichainIndexingSnapshot,
  OmnichainIndexingStatusIds,
  type SerializedChainIndexingSnapshot,
  type SerializedChainIndexingSnapshotBackfill,
  type SerializedChainIndexingSnapshotCompleted,
  type SerializedChainIndexingSnapshotFollowing,
  type SerializedChainIndexingSnapshotQueued,
  type SerializedOmnichainIndexingSnapshot,
  type SerializedOmnichainIndexingSnapshotBackfill,
  type SerializedOmnichainIndexingSnapshotCompleted,
  type SerializedOmnichainIndexingSnapshotFollowing,
  type SerializedOmnichainIndexingSnapshotUnstarted,
  type UnixTimestamp,
  createIndexingConfig,
  deserializeOmnichainIndexingSnapshot,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
} from "@ensnode/ensnode-sdk";

/**
 * Chain Metadata
 *
 * Chain metadata, required to determine {@link ChainIndexingSnapshot}.
 */
export interface ChainMetadata {
  chainId: ChainId;

  /**
   * Historical Total Blocks
   *
   * Blocks count to be process during backfill.
   */
  historicalTotalBlocks: number;

  /**
   * Is Sync Complete?
   *
   * Tells if the backfill has finished.
   */
  isSyncComplete: boolean;

  /**
   * Is Sync Realtime?
   *
   * Tells if there's ongoing indexing following the backfill.
   */
  isSyncRealtime: boolean;

  /**
   * Ponder blocks config
   *
   * Based on ponder.config.ts output.
   */
  config: {
    startBlock: BlockRef;

    endBlock: BlockRef | null;
  };

  /**
   * Backfill end block
   *
   * The block at which the backfill will end.
   */
  backfillEndBlock: BlockRef;

  /**
   * Sync block
   *
   * The latest block stored in the RPC cache.
   */
  syncBlock: BlockRef;

  /**
   * Status block
   *
   * Either:
   * - the first block to be indexed, or
   * - the last indexed block,
   * for the chain.
   */
  statusBlock: BlockRef;
}

/**
 * Unvalidated representation of {@link ChainMetadata}.
 */
export interface UnvalidatedChainMetadata
  extends DeepPartial<Omit<ChainMetadata, "isSyncComplete" | "isSyncRealtime">> {
  isSyncComplete: number | undefined;
  isSyncRealtime: number | undefined;
}

/**
 * Create {@link ChainIndexingSnapshot} for the indexed chain metadata.
 *
 * This function uses the current system timestamp to calculate
 * `approxRealtimeDistance` for chains in "following" status.
 */
export function createChainIndexingSnapshot(chainMetadata: ChainMetadata): ChainIndexingSnapshot {
  const {
    config: chainBlocksConfig,
    backfillEndBlock: chainBackfillEndBlock,
    isSyncComplete,
    isSyncRealtime,
    syncBlock: chainSyncBlock,
    statusBlock: chainStatusBlock,
  } = chainMetadata;

  const { startBlock, endBlock } = chainBlocksConfig;
  const config = createIndexingConfig(startBlock, endBlock);

  // In omnichain ordering, if the startBlock is the same as the
  // status block, the chain has not started yet.
  if (chainBlocksConfig.startBlock.number === chainStatusBlock.number) {
    return {
      status: ChainIndexingStatusIds.Queued,
      config,
    } satisfies SerializedChainIndexingSnapshotQueued;
  }

  if (isSyncComplete) {
    if (config.type !== ChainIndexingConfigTypeIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Definite}' indexing config type.`,
      );
    }

    return {
      status: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: chainStatusBlock,
      config,
    } satisfies SerializedChainIndexingSnapshotCompleted;
  }

  if (isSyncRealtime) {
    if (config.type !== ChainIndexingConfigTypeIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Indefinite}' indexing config type.`,
      );
    }

    return {
      status: ChainIndexingStatusIds.Following,
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainSyncBlock,
      config: {
        type: config.type,
        startBlock: config.startBlock,
      },
    } satisfies SerializedChainIndexingSnapshotFollowing;
  }

  return {
    status: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: chainStatusBlock,
    backfillEndBlock: chainBackfillEndBlock,
    config,
  } satisfies SerializedChainIndexingSnapshotBackfill;
}

/**
 * Create Omnichain Indexing Snapshot
 *
 * Creates {@link OmnichainIndexingSnapshot} from serialized chain snapshots and "now" timestamp.
 */
export function createOmnichainIndexingSnapshot(
  serializedChainSnapshots: Record<ChainIdString, SerializedChainIndexingSnapshot>,
  nowTimestamp: UnixTimestamp,
): OmnichainIndexingSnapshot {
  const chains = Object.values(serializedChainSnapshots);
  const omnichainStatus = getOmnichainIndexingStatus(chains);
  const omnichainIndexingCursor = getOmnichainIndexingCursor(chains);
  const snapshotTime = nowTimestamp;

  let serializedOmnichainSnapshot: SerializedOmnichainIndexingSnapshot;

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingSnapshotQueued
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotUnstarted;
      break;
    }

    case OmnichainIndexingStatusIds.Backfill: {
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotBackfill;
      break;
    }

    case OmnichainIndexingStatusIds.Completed: {
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingSnapshotCompleted
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotCompleted;
      break;
    }

    case OmnichainIndexingStatusIds.Following:
      serializedOmnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: serializedChainSnapshots,
        omnichainIndexingCursor,
        snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotFollowing;
      break;
  }

  return deserializeOmnichainIndexingSnapshot(serializedOmnichainSnapshot);
}
