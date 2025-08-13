import { BlockRef, Duration } from "../../shared";
import {
  ChainIndexingCompletedStatus,
  ChainIndexingConfig,
  ChainIndexingDefiniteConfig,
  ChainIndexingIndefiniteConfig,
  ChainIndexingStatus,
  ChainIndexingStatusId,
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
    // simplify state space for OverallIndexingStatusIds by treating Unstarted
    // the same as Backfill
    overallStatus = OverallIndexingStatusIds.Backfill;
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
