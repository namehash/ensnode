import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  createIndexingConfig,
} from "@ensnode/ensnode-sdk";
import {
  type ChainId,
  type ChainIndexingMetrics,
  type ChainIndexingStatus,
  isBlockRefEqualTo,
} from "@ensnode/ponder-sdk";

import type { ChainBlockRefs } from "./chain-block-refs";
import { validateChainIndexingStatusSnapshot } from "./validate/chain-indexing-status-snapshot";

/**
 * Build Chain Indexing Status Snapshot
 *
 * Builds {@link ChainIndexingStatusSnapshot} for a chain based on:
 * - block refs based on chain configuration and RPC data,
 * - current indexing status,
 * - current indexing metrics.
 */
export function buildChainIndexingStatusSnapshot(
  chainId: ChainId,
  chainBlockRefs: ChainBlockRefs,
  chainIndexingMetrics: ChainIndexingMetrics,
  chainIndexingStatus: ChainIndexingStatus,
): ChainIndexingStatusSnapshot {
  const { checkpointBlock } = chainIndexingStatus;
  const config = createIndexingConfig(
    chainBlockRefs.config.startBlock,
    chainBlockRefs.config.endBlock,
  );

  // TODO: Use `ChainIndexingMetrics` data model from PR #1612.
  //       This updated data model includes `type` field to distinguish
  //       between different chain indexing phases, for example:
  //       Queued, Backfill, Realtime, Completed.

  // In omnichain ordering, if the startBlock is the same as the
  // status block, the chain has not started yet.
  if (isBlockRefEqualTo(chainBlockRefs.config.startBlock, checkpointBlock)) {
    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Queued,
      config,
    } satisfies ChainIndexingStatusSnapshotQueued);
  }

  if (chainIndexingMetrics.indexingCompleted) {
    // TODO: move that invariant to validation schema
    if (config.configType !== ChainIndexingConfigTypeIds.Definite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Completed}' indexing status for chain ID '${chainId}' can be only created with the '${ChainIndexingConfigTypeIds.Definite}' indexing config type.`,
      );
    }

    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Completed,
      latestIndexedBlock: checkpointBlock,
      config,
    } satisfies ChainIndexingStatusSnapshotCompleted);
  }

  if (chainIndexingMetrics.indexingRealtime) {
    // TODO: move that invariant to validation schema
    if (config.configType !== ChainIndexingConfigTypeIds.Indefinite) {
      throw new Error(
        `The '${ChainIndexingStatusIds.Following}' indexing status for chain ID '${chainId}' can be only created with the '${ChainIndexingConfigTypeIds.Indefinite}' indexing config type.`,
      );
    }

    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Following,
      latestIndexedBlock: checkpointBlock,
      latestKnownBlock: chainIndexingMetrics.latestSyncedBlock,
      config: {
        configType: config.configType,
        startBlock: config.startBlock,
      },
    } satisfies ChainIndexingStatusSnapshotFollowing);
  }

  return validateChainIndexingStatusSnapshot({
    chainStatus: ChainIndexingStatusIds.Backfill,
    latestIndexedBlock: checkpointBlock,
    backfillEndBlock: chainBlockRefs.backfillEndBlock,
    config,
  } satisfies ChainIndexingStatusSnapshotBackfill);
}

/**
 * Build Chain Indexing Status Snapshots
 *
 * Builds {@link ChainIndexingStatusSnapshot} for each indexed chain based on:
 * - block refs based on chain configuration and RPC data,
 * - current indexing status,
 * - current indexing metrics.
 *
 * @param indexedChainIds list of indexed chain IDs to build snapshots for.
 * @param chainsBlockRefs block refs for indexed chains.
 * @param chainsIndexingMetrics indexing metrics for indexed chains.
 * @param chainsIndexingStatus indexing status for indexed chains.
 *
 * @returns record of {@link ChainIndexingStatusSnapshot} keyed by chain ID.
 *
 * @throws error if any of the required data is missing or if data validation fails.
 */
export function buildChainIndexingStatusSnapshots(
  indexedChainIds: ChainId[],
  chainsBlockRefs: Map<ChainId, ChainBlockRefs>,
  chainsIndexingMetrics: Map<ChainId, ChainIndexingMetrics>,
  chainsIndexingStatus: Map<ChainId, ChainIndexingStatus>,
): Map<ChainId, ChainIndexingStatusSnapshot> {
  const chainStatusSnapshots = new Map<ChainId, ChainIndexingStatusSnapshot>();

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

    const chainStatusSnapshot = buildChainIndexingStatusSnapshot(
      chainId,
      chainBlockRefs,
      chainIndexingMetrics,
      chainIndexingStatus,
    );

    chainStatusSnapshots.set(chainId, chainStatusSnapshot);
  }

  return chainStatusSnapshots;
}
