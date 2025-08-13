import { BlockRef, Duration } from "../../shared";
import {
  ChainIndexingCompletedStatus,
  ChainIndexingConfig,
  ChainIndexingDefiniteConfig,
  ChainIndexingIndefiniteConfig,
  ChainIndexingStatus,
  ChainIndexingStatusForBackfillOverallStatus,
  ChainIndexingStatusForUnstartedOverallStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  OverallIndexingStatusId,
  OverallIndexingStatusIds,
} from "./types";

/**
 * Get {@link OverallIndexingStatusId} based on indexed chains' statuses.
 *
 * This function decides what is the current overall indexing status,
 * based on provided chain indexing statuses. The fact that chain indexing
 * statuses were provided to this function guarantees there was no indexer
 * error, and that the overall indexing status is never
 * an {@link OverallIndexingStatusIds.IndexerError}
 */
export function getOverallIndexingStatus(
  chains: ChainIndexingStatus[],
): Exclude<OverallIndexingStatusId, typeof OverallIndexingStatusIds.IndexerError> {
  const chainStatuses = chains.map((chain) => chain.status);

  let overallStatus: OverallIndexingStatusId;

  if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Following)) {
    overallStatus = OverallIndexingStatusIds.Following;
  } else if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Backfill)) {
    overallStatus = OverallIndexingStatusIds.Backfill;
  } else if (
    chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Unstarted)
  ) {
    overallStatus = OverallIndexingStatusIds.Unstarted;
  } else {
    overallStatus = OverallIndexingStatusIds.Completed;
  }

  return overallStatus;
}

/**
 * Get overall approximate realtime distance across all indexed chains.
 *
 * @throws an error if none of the indexed chains was in the 'following' status.
 */
export function getOverallApproxRealtimeDistance(chains: ChainIndexingStatus[]): Duration {
  const chainapproxRealtimeDistances = chains
    .filter((chain) => chain.status === ChainIndexingStatusIds.Following)
    .map((chain) => chain.approxRealtimeDistance);

  if (chainapproxRealtimeDistances.length === 0) {
    throw new Error(
      `The overall approximate realtime distance value is undefined if no indexed chain is in the '${OverallIndexingStatusIds.Following}' status`,
    );
  }

  const approxRealtimeDistance = Math.max(...chainapproxRealtimeDistances);

  return approxRealtimeDistance;
}

/**
 * Create {@link ChainIndexingConfig} for given block refs.
 *
 * @param startBlock required block ref
 * @param endBlock optional block ref
 */
export function createIndexingConfig(
  startBlock: BlockRef,
  endBlock: BlockRef | null,
): ChainIndexingConfig {
  if (endBlock) {
    return {
      strategy: ChainIndexingStrategyIds.Definite,
      startBlock,
      endBlock,
    } satisfies ChainIndexingDefiniteConfig;
  }

  return {
    strategy: ChainIndexingStrategyIds.Indefinite,
    startBlock,
    endBlock: null,
  } satisfies ChainIndexingIndefiniteConfig;
}

/**
 * Check if Chain Indexing Statuses fit the 'unstarted' overall status
 * requirements:
 * - At least one chain is guaranteed to be in the "unstarted" status.
 * - Each chain is guaranteed to have a status of either "unstarted",
 *   "unstarted" or "completed".
 *
 * Note: This function narrows the {@linkChainIndexingStatus} type to
 * {@link ChainIndexingStatusForUnstartedOverallStatus}.
 */
export function checkChainIndexingStatusesForUnstartedOverallStatus(
  chains: ChainIndexingStatus[],
): chains is ChainIndexingStatusForUnstartedOverallStatus[] {
  const atLeastOneChainInTargetStatus = chains.some(
    (chain) => chain.status === ChainIndexingStatusIds.Unstarted,
  );
  const otherChainsHaveValidStatuses = chains.every(
    (chain) =>
      chain.status === ChainIndexingStatusIds.Unstarted ||
      chain.status === ChainIndexingStatusIds.Completed,
  );

  return atLeastOneChainInTargetStatus && otherChainsHaveValidStatuses;
}

/**
 * Check if Chain Indexing Statuses fit the 'backfill' overall status
 * requirements:
 * - At least one chain is guaranteed to be in the "backfill" status.
 * - Each chain is guaranteed to have a status of either "unstarted",
 *   "backfill" or "completed".
 *
 * Note: This function narrows the {@linkChainIndexingStatus} type to
 * {@link ChainIndexingStatusForBackfillOverallStatus}.
 */
export function checkChainIndexingStatusesForBackfillOverallStatus(
  chains: ChainIndexingStatus[],
): chains is ChainIndexingStatusForBackfillOverallStatus[] {
  const atLeastOneChainInTargetStatus = chains.some(
    (chain) => chain.status === ChainIndexingStatusIds.Backfill,
  );
  const otherChainsHaveValidStatuses = chains.every(
    (chain) =>
      chain.status === ChainIndexingStatusIds.Unstarted ||
      chain.status === ChainIndexingStatusIds.Backfill ||
      chain.status === ChainIndexingStatusIds.Completed,
  );

  return atLeastOneChainInTargetStatus && otherChainsHaveValidStatuses;
}

/**
 * Checks if Chain Indexing Statuses fit the 'completed' overall status
 * requirements:
 * - Any chain is guaranteed to have a status of "completed".
 *
 * Note: This function narrows the {@linkChainIndexingStatus} type to
 * {@link ChainIndexingCompletedStatus}.
 */
export function checkChainIndexingStatusesForCompletedOverallStatus(
  chains: ChainIndexingStatus[],
): chains is ChainIndexingCompletedStatus[] {
  const allChainsHaveValidStatuses = chains.every(
    (chain) => chain.status === ChainIndexingStatusIds.Completed,
  );

  return allChainsHaveValidStatuses;
}

/**
 * Checks Chain Indexing Statuses fit the 'completed' overall status
 * requirements:
 * - At least one chain is guaranteed to be in the "following" status.
 * - Any other chain can have any status.
 */
export function checkChainIndexingStatusesForFollowingOverallStatus(
  chains: ChainIndexingStatus[],
): chains is ChainIndexingStatus[] {
  const allChainsHaveValidStatuses = chains.some(
    (chain) => chain.status === ChainIndexingStatusIds.Following,
  );

  return allChainsHaveValidStatuses;
}
