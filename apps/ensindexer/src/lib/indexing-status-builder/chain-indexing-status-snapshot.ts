import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  createIndexingConfig,
  type Unvalidated,
  validateChainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  type ChainId,
  type ChainIndexingMetrics,
  ChainIndexingStates,
  type ChainIndexingStatus,
  isBlockRefEqualTo,
} from "@ensnode/ponder-sdk";

import type { ChainBlockRefs } from "./chain-block-refs";

/**
 * Build Unvalidated Chain Indexing Status Snapshot
 */
export function buildUnvalidatedChainIndexingStatusSnapshot(
  chainId: ChainId,
  chainBlockRefs: ChainBlockRefs,
  chainIndexingMetrics: ChainIndexingMetrics,
  chainIndexingStatus: ChainIndexingStatus,
): Unvalidated<ChainIndexingStatusSnapshot> {
  const { checkpointBlock } = chainIndexingStatus;

  const config = createIndexingConfig(
    chainBlockRefs.config.startBlock,
    chainBlockRefs.config.endBlock,
  );

  // In omnichain ordering, if the startBlock is the same as the
  // status block, the chain has not started yet.
  if (isBlockRefEqualTo(chainBlockRefs.config.startBlock, checkpointBlock)) {
    return {
      chainStatus: ChainIndexingStatusIds.Queued,
      config,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotQueued>;
  }

  if (chainIndexingMetrics.state === ChainIndexingStates.Completed) {
    // TODO: move that invariant to validation schema
    if (config.configType !== ChainIndexingConfigTypeIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status for chain ID '${chainId}' can be only created with the '${ChainIndexingConfigTypeIds.Definite}' indexing config type.`,
      );
    }

    return {
      chainStatus: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: checkpointBlock,
      config,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotCompleted>;
  }

  if (chainIndexingMetrics.state === ChainIndexingStates.Realtime) {
    // TODO: move that invariant to validation schema
    if (config.configType !== ChainIndexingConfigTypeIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status for chain ID '${chainId}' can be only created with the '${ChainIndexingConfigTypeIds.Indefinite}' indexing config type.`,
      );
    }

    return {
      chainStatus: ChainIndexingStatusIds.Following,
      latestIndexedBlock: checkpointBlock,
      latestKnownBlock: chainIndexingMetrics.latestSyncedBlock,
      config,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotFollowing>;
  }

  return {
    chainStatus: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: checkpointBlock,
    backfillEndBlock: chainBlockRefs.backfillEndBlock,
    config,
  } satisfies Unvalidated<ChainIndexingStatusSnapshotBackfill>;
}

/**
 * Build Unvalidated Chain Indexing Status Snapshots
 *
 * @param indexedChainIds list of indexed chain IDs to build snapshots for.
 * @param chainsBlockRefs block refs for indexed chains.
 * @param chainsIndexingMetrics indexing metrics for indexed chains.
 * @param chainsIndexingStatus indexing status for indexed chains.
 *
 * @returns record of {@link Unvalidated<ChainIndexingStatusSnapshot>} keyed by chain ID.
 *
 * @throws error if any of the required data is missing or if data validation fails.
 */
export function buildUnvalidatedChainIndexingStatusSnapshots(
  indexedChainIds: ChainId[],
  chainsBlockRefs: Map<ChainId, ChainBlockRefs>,
  chainsIndexingMetrics: Map<ChainId, ChainIndexingMetrics>,
  chainsIndexingStatus: Map<ChainId, ChainIndexingStatus>,
): Map<ChainId, Unvalidated<ChainIndexingStatusSnapshot>> {
  const chainStatusSnapshots = new Map<ChainId, Unvalidated<ChainIndexingStatusSnapshot>>();

  // Build chain indexing status snapshot for each indexed chain.
  for (const chainId of indexedChainIds) {
    const chainBlockRefs = chainsBlockRefs.get(chainId);
    const chainIndexingStatus = chainsIndexingStatus.get(chainId);
    const chainIndexingMetrics = chainsIndexingMetrics.get(chainId);

    // Invariant: block refs must be defined for the chain
    if (!chainBlockRefs) {
      throw new Error(`Block refs must be defined for chain ID ${chainId}`);
    }

    // Invariant: chainIndexingStatus must be defined for the chain
    if (!chainIndexingStatus) {
      throw new Error(`Indexing status must be defined for chain ID ${chainId}`);
    }

    // Invariant: chainIndexingMetrics must be defined for the chain
    if (!chainIndexingMetrics) {
      throw new Error(`Indexing metrics must be defined for chain ID ${chainId}`);
    }

    const chainStatusSnapshot = buildUnvalidatedChainIndexingStatusSnapshot(
      chainId,
      chainBlockRefs,
      chainIndexingMetrics,
      chainIndexingStatus,
    );

    chainStatusSnapshots.set(chainId, chainStatusSnapshot);
  }

  return chainStatusSnapshots;
}
