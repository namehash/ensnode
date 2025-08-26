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
  type ChainIndexingBackfillStatus,
  type ChainIndexingCompletedStatus,
  type ChainIndexingFollowingStatus,
  type ChainIndexingStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  type ChainIndexingUnstartedStatus,
  type DeepPartial,
  type Duration,
  type UnixTimestamp,
  createIndexingConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Chain Metadata
 *
 * Chain metadata, required to determine {@link ChainIndexingStatus}.
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
 * Get {@link ChainIndexingStatus} for the indexed chain metadata.
 *
 * This function uses the current system timestamp to calculate
 * `approxRealtimeDistance` for chains in "following" status.
 */
export function getChainIndexingStatus(
  chainMetadata: ChainMetadata,
  systemTimestamp: UnixTimestamp,
): ChainIndexingStatus {
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
      status: ChainIndexingStatusIds.Unstarted,
      config,
    } satisfies ChainIndexingUnstartedStatus;
  }

  if (isSyncComplete) {
    if (config.strategy !== ChainIndexingStrategyIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status can be only created with the '${ChainIndexingStrategyIds.Definite}' indexing strategy.`,
      );
    }

    return {
      status: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: chainStatusBlock,
      config,
    } satisfies ChainIndexingCompletedStatus;
  }

  if (isSyncRealtime) {
    if (config.strategy !== ChainIndexingStrategyIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status can be only created with the '${ChainIndexingStrategyIds.Indefinite}' indexing strategy.`,
      );
    }

    /**
     * It's possible that the current system time of the ENSIndexer instance
     * is set to be ahead of the time agreed to by the blockchain and held in
     * chainStatusBlock.timestamp.
     *
     * Here we enforce that the Duration value can never be negative,
     * even if system clocks are misconfigured.
     */
    const approxRealtimeDistance: Duration = Math.max(
      0,
      systemTimestamp - chainStatusBlock.timestamp,
    );

    return {
      status: ChainIndexingStatusIds.Following,
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainSyncBlock,
      approxRealtimeDistance,
      config: {
        strategy: config.strategy,
        startBlock: config.startBlock,
      },
    } satisfies ChainIndexingFollowingStatus;
  }

  return {
    status: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: chainStatusBlock,
    latestSyncedBlock: chainSyncBlock,
    backfillEndBlock: chainBackfillEndBlock,
    config,
  } satisfies ChainIndexingBackfillStatus;
}
