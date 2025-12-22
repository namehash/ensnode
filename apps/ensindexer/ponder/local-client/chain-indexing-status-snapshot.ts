import {
  type ChainIdString,
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  createIndexingConfig,
  deserializeBlockRef,
  deserializeChainId,
  deserializeChainIndexingStatusSnapshot,
  deserializeNonNegativeInteger,
  type SerializedChainIndexingStatusSnapshot,
  type SerializedChainIndexingStatusSnapshotBackfill,
  type SerializedChainIndexingStatusSnapshotCompleted,
  type SerializedChainIndexingStatusSnapshotFollowing,
  type SerializedChainIndexingStatusSnapshotQueued,
} from "@ensnode/ensnode-sdk";
import type {
  ChainBlockRefs,
  ChainMetadata,
  ChainName,
  PonderMetricsResponse,
  PonderStatusResponse,
  UnvalidatedChainMetadata,
} from "@ensnode/ponder-sdk";

/**
 * Create {@link ChainIndexingStatusSnapshot} for the indexed chain metadata.
 */
export function createChainIndexingSnapshot(
  chainMetadata: ChainMetadata,
): ChainIndexingStatusSnapshot {
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
    return deserializeChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Queued,
      config,
    } satisfies SerializedChainIndexingStatusSnapshotQueued);
  }

  if (isSyncComplete) {
    if (config.configType !== ChainIndexingConfigTypeIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Definite}' indexing config type.`,
      );
    }

    return deserializeChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: chainStatusBlock,
      config,
    } satisfies SerializedChainIndexingStatusSnapshotCompleted);
  }

  if (isSyncRealtime) {
    if (config.configType !== ChainIndexingConfigTypeIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status can be only created with the '${ChainIndexingConfigTypeIds.Indefinite}' indexing config type.`,
      );
    }

    return deserializeChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Following,
      latestIndexedBlock: chainStatusBlock,
      latestKnownBlock: chainSyncBlock,
      config: {
        configType: config.configType,
        startBlock: config.startBlock,
      },
    } satisfies SerializedChainIndexingStatusSnapshotFollowing);
  }

  return deserializeChainIndexingStatusSnapshot({
    chainStatus: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: chainStatusBlock,
    backfillEndBlock: chainBackfillEndBlock,
    config,
  } satisfies SerializedChainIndexingStatusSnapshotBackfill);
}

/**
 * Create serialized chain indexing snapshots.
 *
 * The output of this function is required for
 * calling {@link createOmnichainIndexingSnapshot}.
 */
export function createSerializedChainSnapshots(
  chainIds: ChainIdString[],
  chainsBlockRefs: Map<ChainName, ChainBlockRefs>,
  metrics: PonderMetricsResponse,
  status: PonderStatusResponse,
): Record<ChainIdString, SerializedChainIndexingStatusSnapshot> {
  const serializedChainIndexingStatusSnapshots = {} as Record<
    ChainIdString,
    ChainIndexingStatusSnapshot
  >;

  // collect unvalidated chain metadata for each indexed chain
  for (const chainId of chainIds) {
    const chainBlockRefs = chainsBlockRefs.get(chainId);

    const statusChainId = deserializeChainId(`${status[chainId]?.id}`);

    const backfillEndBlock = deserializeBlockRef(chainBlockRefs?.backfillEndBlock);

    const syncBlock = deserializeBlockRef({
      number: metrics.getValue("ponder_sync_block", { chain: chainId }),
      timestamp: metrics.getValue("ponder_sync_block_timestamp", { chain: chainId }),
    });

    const statusBlock = deserializeBlockRef({
      number: status[chainId]?.block.number,
      timestamp: status[chainId]?.block.timestamp,
    });

    const historicalTotalBlocks = deserializeNonNegativeInteger(
      metrics.getValue("ponder_historical_total_blocks", {
        chain: chainId,
      }),
    );

    const isSyncComplete = metrics.getValue("ponder_sync_is_complete", { chain: chainId });

    const isSyncRealtime = metrics.getValue("ponder_sync_is_realtime", { chain: chainId });

    if (typeof isSyncRealtime === "string" && !["0", "1"].includes(isSyncRealtime)) {
      throw new Error(
        `The 'ponder_sync_is_realtime' metric for chain '${chainId}' must be a string with value "0" or "1".`,
      );
    }

    const config = {
      startBlock: deserializeBlockRef(chainBlockRefs?.config.startBlock),
      endBlock:
        chainBlockRefs?.config.endBlock === null
          ? null
          : deserializeBlockRef(chainBlockRefs?.config.endBlock),
    };

    const chainMetadata = {
      chainId: statusChainId,
      isSyncComplete: String(isSyncComplete) === "1",
      isSyncRealtime: String(isSyncRealtime) === "1",
      config,
      backfillEndBlock,
      historicalTotalBlocks,
      syncBlock,
      statusBlock,
    } satisfies UnvalidatedChainMetadata;

    serializedChainIndexingStatusSnapshots[chainId] = createChainIndexingSnapshot(chainMetadata);
  }

  return serializedChainIndexingStatusSnapshots;
}
