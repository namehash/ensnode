import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  type Unvalidated,
  validateChainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  type BlockRefRangeBounded,
  type BlockRefRangeLeftBounded,
  type ChainId,
  ChainIndexingStates,
  isBlockRefEqualTo,
} from "@ensnode/ponder-sdk";

import type { ChainIndexingMetadata } from "./chain-indexing-metadata";

/**
 * Build Chain Indexing Status Snapshot from metadata.
 *
 * @param metadata - Complete indexing metadata including backfill scope,
 *   Ponder config, metrics, and status needed to determine the chain's state.
 *
 * @returns The chain indexing status snapshot.
 */
function buildChainIndexingStatusSnapshot(
  metadata: ChainIndexingMetadata,
): ChainIndexingStatusSnapshot {
  const { backfillScope, indexingConfig, indexingMetrics, indexingStatus } = metadata;
  const { checkpointBlock } = indexingStatus;

  // In omnichain ordering, if the startBlock is the same as the
  // status block, the chain has not started yet.
  if (isBlockRefEqualTo(backfillScope.startBlock, checkpointBlock)) {
    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Queued,
      config: indexingConfig,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotQueued>);
  }

  if (indexingMetrics.state === ChainIndexingStates.Completed) {
    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: checkpointBlock,
      config: indexingConfig as Unvalidated<BlockRefRangeBounded>,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotCompleted>);
  }

  if (indexingMetrics.state === ChainIndexingStates.Realtime) {
    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Following,
      latestIndexedBlock: checkpointBlock,
      latestKnownBlock: indexingMetrics.latestSyncedBlock,
      config: indexingConfig as Unvalidated<BlockRefRangeLeftBounded>,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotFollowing>);
  }

  return validateChainIndexingStatusSnapshot({
    chainStatus: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: checkpointBlock,
    backfillEndBlock: backfillScope.endBlock,
    config: indexingConfig,
  } satisfies Unvalidated<ChainIndexingStatusSnapshotBackfill>);
}

/**
 * Build Chain Indexing Status Snapshots for all indexed chains.
 *
 * @param chainsIndexingMetadata - A map of chain IDs to their complete
 *                                 indexing metadata.
 *
 * @returns A map of chain IDs to their chain indexing status snapshots.
 */
export function buildChainStatusSnapshots(
  chainsIndexingMetadata: Map<ChainId, ChainIndexingMetadata>,
): Map<ChainId, ChainIndexingStatusSnapshot> {
  const chainStatusSnapshots = new Map<ChainId, ChainIndexingStatusSnapshot>();

  // Build chain indexing status snapshot for each indexed chain.
  for (const [chainId, metadata] of chainsIndexingMetadata) {
    const chainStatusSnapshot = buildChainIndexingStatusSnapshot(metadata);

    chainStatusSnapshots.set(chainId, chainStatusSnapshot);
  }

  return chainStatusSnapshots;
}
