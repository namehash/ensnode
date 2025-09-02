import { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";
import {
  ChainIndexingActiveStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingConfig,
  ChainIndexingDefiniteConfig,
  ChainIndexingIndefiniteConfig,
  ChainIndexingQueuedStatus,
  ChainIndexingStandbyStatus,
  ChainIndexingStatus,
  ChainIndexingStatusForBackfillOverallStatus,
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
  } else if (chainStatuses.some((chainStatus) => chainStatus === ChainIndexingStatusIds.Queued)) {
    overallStatus = OverallIndexingStatusIds.Queued;
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
  const chainApproxRealtimeDistances = chains
    .filter((chain) => chain.status === ChainIndexingStatusIds.Following)
    .map((chain) => chain.approxRealtimeDistance);

  if (chainApproxRealtimeDistances.length === 0) {
    throw new Error(
      `The overall approximate realtime distance value is undefined if no indexed chain is in the '${OverallIndexingStatusIds.Following}' status`,
    );
  }

  const approxRealtimeDistance = Math.max(...chainApproxRealtimeDistances);

  return approxRealtimeDistance;
}

/**
 * Get lowest of the highest end block across all chains which status is
 * {@link ChainIndexingStatus}.
 */
export function getTimestampForLowestOmnichainStartBlock(
  chains: ChainIndexingStatus[],
): UnixTimestamp {
  const earliestKnownBlockTimestamps: UnixTimestamp[] = chains.map(
    (chain) => chain.config.startBlock.timestamp,
  );

  return Math.min(...earliestKnownBlockTimestamps);
}

/**
 * Get timestamp of the highest known block across all chains which status is
 * {@link ChainIndexingStatusForBackfillOverallStatus}.
 */
export function getTimestampForHighestOmnichainKnownBlock(
  chains: ChainIndexingStatus[],
): UnixTimestamp {
  const latestKnownBlockTimestamps: UnixTimestamp[] = [];

  for (const chain of chains) {
    switch (chain.status) {
      case ChainIndexingStatusIds.Queued:
        if (chain.config.endBlock) {
          latestKnownBlockTimestamps.push(chain.config.endBlock.timestamp);
        }
        break;

      case ChainIndexingStatusIds.Backfill:
        latestKnownBlockTimestamps.push(chain.backfillEndBlock.timestamp);

        break;

      case ChainIndexingStatusIds.Completed:
        latestKnownBlockTimestamps.push(chain.latestIndexedBlock.timestamp);
        break;

      case ChainIndexingStatusIds.Following:
        latestKnownBlockTimestamps.push(chain.latestKnownBlock.timestamp);
        break;
    }
  }

  return Math.max(...latestKnownBlockTimestamps);
}

/**
 * Get Omnichain Indexing Cursor across all chains which status is
 * {@link ChainIndexingActiveStatus}.
 */
export function getOmnichainIndexingCursor(chains: ChainIndexingActiveStatus[]): UnixTimestamp {
  return Math.min(...chains.map((chain) => chain.latestIndexedBlock.timestamp));
}

/**
 * Get all chains which status is {@link ChainIndexingActiveStatus}.
 */
export function getActiveChains(chains: ChainIndexingStatus[]): ChainIndexingActiveStatus[] {
  return chains.filter(
    (chain) =>
      chain.status === ChainIndexingStatusIds.Backfill ||
      chain.status === ChainIndexingStatusIds.Following,
  );
}

/**
 * Get all chains which status is {@link ChainIndexingStandbyStatus}.
 */
export function getStandbyChains(chains: ChainIndexingStatus[]): ChainIndexingStandbyStatus[] {
  return chains.filter(
    (chain) =>
      chain.status === ChainIndexingStatusIds.Queued ||
      chain.status === ChainIndexingStatusIds.Completed,
  );
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
 * Check if Chain Indexing Statuses fit the 'queued' overall status
 * requirements:
 * - All chains are guaranteed to have a status of "queued".
 *
 * Note: This function narrows the {@link ChainIndexingStatus} type to
 * {@link ChainIndexingQueuedStatus}.
 */
export function checkChainIndexingStatusesForQueuedOverallStatus(
  chains: ChainIndexingStatus[],
): chains is ChainIndexingQueuedStatus[] {
  return chains.every((chain) => chain.status === ChainIndexingStatusIds.Queued);
}

/**
 * Check if Chain Indexing Statuses fit the 'backfill' overall status
 * requirements:
 * - At least one chain is guaranteed to be in the "backfill" status.
 * - Each chain is guaranteed to have a status of either "queued",
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
      chain.status === ChainIndexingStatusIds.Queued ||
      chain.status === ChainIndexingStatusIds.Backfill ||
      chain.status === ChainIndexingStatusIds.Completed,
  );

  return atLeastOneChainInTargetStatus && otherChainsHaveValidStatuses;
}

/**
 * Checks if Chain Indexing Statuses fit the 'completed' overall status
 * requirements:
 * - All chains are guaranteed to have a status of "completed".
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
 * Checks Chain Indexing Statuses fit the 'following' overall status
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

/**
 * Sort a list of [{@link ChainId}, {@link ChainIndexingStatus}] tuples
 * by the omnichain start block timestamp in ascending order.
 */
export function sortAscChainStatusesByStartBlock<ChainStatusType extends ChainIndexingStatus>(
  chains: [ChainId, ChainStatusType][],
): [ChainId, ChainStatusType][] {
  // Sort the chain statuses by the omnichain first block to index timestamp
  chains.sort(
    ([, chainA], [, chainB]) =>
      chainA.config.startBlock.timestamp - chainB.config.startBlock.timestamp,
  );

  return chains;
}
