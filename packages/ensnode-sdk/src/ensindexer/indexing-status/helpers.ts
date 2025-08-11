import { BlockRef, Duration } from "../../shared";
import {
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
 * Note: This function expects chain indexing statuses on input and will be
 * never called after indexer error. This is why we exclude indexer error
 * status from the set of possible statuses returned by this function.
 */
export function getOverallIndexingStatus(chains: ChainIndexingStatus[]): ChainIndexingStatusId {
  const chainStatuses = chains.map((chain) => chain.status);

  let overallStatus: ChainIndexingStatusId;

  if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Following)) {
    overallStatus = ChainIndexingStatusIds.Following;
  } else if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Backfill)) {
    overallStatus = ChainIndexingStatusIds.Backfill;
  } else if (
    chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Unstarted)
  ) {
    overallStatus = ChainIndexingStatusIds.Unstarted;
  } else {
    overallStatus = ChainIndexingStatusIds.Completed;
  }

  return overallStatus;
}

/**
 * Get overall approximate realtime distance across all indexed chains.
 *
 * @throws an error if none of the indexed chains was in the 'following' status.
 */
export function getOverallApproxRealtimeDistance(chains: ChainIndexingStatus[]): Duration {
  const chainApproximateRealtimeDistances = chains
    .filter((chain) => chain.status === ChainIndexingStatusIds.Following)
    .map((chain) => chain.approximateRealtimeDistance);

  if (chainApproximateRealtimeDistances.length === 0) {
    throw new Error(
      `The overall approximate realtime distance value remains unknown if no indexed chain is in the '${OverallIndexingStatusIds.Following}' status`,
    );
  }

  const approximateRealtimeDistance = Math.max(...chainApproximateRealtimeDistances);

  return approximateRealtimeDistance;
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
      indexingStrategy: ChainIndexingStrategyIds.Definite,
      startBlock,
      endBlock,
    } satisfies ChainIndexingDefiniteConfig;
  }

  return {
    indexingStrategy: ChainIndexingStrategyIds.Indefinite,
    startBlock,
    endBlock: null,
  } satisfies ChainIndexingIndefiniteConfig;
}
