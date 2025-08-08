import type {
  BlockNumber,
  BlockRef,
  Blockrange,
  ChainId,
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingStatus,
  ChainIndexingUnstartedStatus,
  DeepPartial,
  Duration,
} from "@ensnode/ensnode-sdk";
import type { ChainName } from "./config";
import type { PrometheusMetrics } from "./metrics";

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
 */
export function getChainIndexingStatus(chainMetadata: ChainMetadata): ChainIndexingStatus {
  const {
    config: chainBlocksConfig,
    backfillEndBlock: chainBackfillEndBlock,
    isSyncComplete,
    isSyncRealtime,
    syncBlock: chainSyncBlock,
    statusBlock: chainStatusBlock,
  } = chainMetadata;

  // In omnichain ordering, if the startBlock is the same as the
  // status block, the chain has not started yet.
  if (chainBlocksConfig.startBlock.number === chainStatusBlock.number) {
    return {
      status: "unstarted",
      config: {
        startBlock: chainBlocksConfig.startBlock,
        endBlock: chainBlocksConfig.endBlock,
      },
    } satisfies ChainIndexingUnstartedStatus;
  }

  if (isSyncComplete) {
    return {
      status: "completed",
      config: {
        startBlock: chainBlocksConfig.startBlock,
        endBlock: chainBlocksConfig.endBlock!,
      },
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainStatusBlock,
    } satisfies ChainIndexingCompletedStatus;
  }

  if (isSyncRealtime) {
    const nowUnixTimestamp = Math.floor(Date.now() / 1000);
    const approximateRealtimeDistance: Duration = Math.max(
      0,
      nowUnixTimestamp - chainStatusBlock.timestamp,
    );

    return {
      status: "following",
      config: {
        startBlock: chainBlocksConfig.startBlock,
      },
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainSyncBlock,
      approximateRealtimeDistance,
    } satisfies ChainIndexingFollowingStatus;
  }

  return {
    status: "backfill",
    config: {
      startBlock: chainBlocksConfig.startBlock,
      endBlock: chainBlocksConfig.endBlock,
    },
    latestIndexedBlock: chainStatusBlock,
    // During the backfill, the latestKnownBlock is the backfillEndBlock.
    latestKnownBlock: chainBackfillEndBlock,
    backfillEndBlock: chainBackfillEndBlock,
  } satisfies ChainIndexingBackfillStatus;
}
