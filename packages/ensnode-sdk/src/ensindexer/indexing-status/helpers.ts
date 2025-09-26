import { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";
import {
  ChainIndexingConfig,
  ChainIndexingConfigDefinite,
  ChainIndexingConfigIndefinite,
  ChainIndexingConfigTypeIds,
  ChainIndexingSnapshot,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill,
  ChainIndexingSnapshotQueued,
  ChainIndexingStatusIds,
  OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "./types";

/**
 * Get {@link OmnichainIndexingStatusId} based on indexed chains' statuses.
 *
 * This function decides what is the current overall indexing status,
 * based on provided chain indexing statuses. The fact that chain indexing
 * statuses were provided to this function guarantees there was no indexer
 * error, and that the overall indexing status is never
 * an {@link OmnichainIndexingStatusIds.IndexerError}
 *
 * @throws an error if unable to determine overall indexing status
 */
export function getOmnichainIndexingStatus(
  chains: ChainIndexingSnapshot[],
): OmnichainIndexingStatusId {
  if (checkChainIndexingStatusesForOmnichainStatusFollowing(chains)) {
    return OmnichainIndexingStatusIds.Following;
  }

  if (checkChainIndexingStatusesForOmnichainStatusBackfill(chains)) {
    return OmnichainIndexingStatusIds.Backfill;
  }

  if (checkChainIndexingStatusesForOmnichainStatusUnstarted(chains)) {
    return OmnichainIndexingStatusIds.Unstarted;
  }

  if (checkChainIndexingStatusesForOmnichainStatusCompleted(chains)) {
    return OmnichainIndexingStatusIds.Completed;
  }

  // if none of the chain statuses matched, throw an error
  throw new Error(`Unable to determine omnichain indexing status for provided chains.`);
}

/**
 * Get lowest of the highest end block across all chains which status is
 * {@link ChainIndexingSnapshot}.
 */
export function getTimestampForLowestOmnichainStartBlock(
  chains: ChainIndexingSnapshot[],
): UnixTimestamp {
  const earliestKnownBlockTimestamps: UnixTimestamp[] = chains.map(
    (chain) => chain.config.startBlock.timestamp,
  );

  return Math.min(...earliestKnownBlockTimestamps);
}

/**
 * Get timestamp of the highest known block across all chains which status is
 * {@link ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill}.
 */
export function getTimestampForHighestOmnichainKnownBlock(
  chains: ChainIndexingSnapshot[],
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
 * Get Omnichain Indexing Cursor
 *
 * The cursor tracks the "highest" latest indexed block timestamp across
 * all indexed chains. If all chains are queued, the cursor tracks the moment
 * just before the earliest start block timestamp across those chains.
 *
 * @throws an error if no chains are provided
 */
export function getOmnichainIndexingCursor(chains: ChainIndexingSnapshot[]): UnixTimestamp {
  if (chains.length === 0) {
    throw new Error(`Unable to determine omnichain indexing cursor when no chains were provided.`);
  }

  // if all chains are queued, the cursor tracks the moment just before
  if (chains.every((chain) => chain.status === ChainIndexingStatusIds.Queued)) {
    // the earliest start block timestamp across those chains
    const earliestStartBlockTimestamps = chains.map((chain) => chain.config.startBlock.timestamp);

    return Math.min(...earliestStartBlockTimestamps) - 1;
  }

  // otherwise, the cursor tracks the "highest" latest indexed block timestamp
  // across all indexed chains
  const latestIndexedBlockTimestamps = chains
    .filter((chain) => chain.status !== ChainIndexingStatusIds.Queued)
    .map((chain) => chain.latestIndexedBlock.timestamp);

  return Math.max(...latestIndexedBlockTimestamps);
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
      type: ChainIndexingConfigTypeIds.Definite,
      startBlock,
      endBlock,
    } satisfies ChainIndexingConfigDefinite;
  }

  return {
    type: ChainIndexingConfigTypeIds.Indefinite,
    startBlock,
    endBlock: null,
  } satisfies ChainIndexingConfigIndefinite;
}

/**
 * Check if Chain Indexing Statuses fit the 'unstarted' overall status
 * requirements:
 * - All chains are guaranteed to have a status of "queued".
 *
 * Note: This function narrows the {@link ChainIndexingSnapshot} type to
 * {@link ChainIndexingSnapshotQueued}.
 */
export function checkChainIndexingStatusesForOmnichainStatusUnstarted(
  chains: ChainIndexingSnapshot[],
): chains is ChainIndexingSnapshotQueued[] {
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
 * {@link ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill}.
 */
export function checkChainIndexingStatusesForOmnichainStatusBackfill(
  chains: ChainIndexingSnapshot[],
): chains is ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill[] {
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
 * {@link ChainIndexingSnapshotCompleted}.
 */
export function checkChainIndexingStatusesForOmnichainStatusCompleted(
  chains: ChainIndexingSnapshot[],
): chains is ChainIndexingSnapshotCompleted[] {
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
export function checkChainIndexingStatusesForOmnichainStatusFollowing(
  chains: ChainIndexingSnapshot[],
): chains is ChainIndexingSnapshot[] {
  const allChainsHaveValidStatuses = chains.some(
    (chain) => chain.status === ChainIndexingStatusIds.Following,
  );

  return allChainsHaveValidStatuses;
}

/**
 * Sort a list of [{@link ChainId}, {@link ChainIndexingSnapshot}] tuples
 * by the omnichain start block timestamp in ascending order.
 */
export function sortAscChainStatusesByStartBlock<ChainStatusType extends ChainIndexingSnapshot>(
  chains: [ChainId, ChainStatusType][],
): [ChainId, ChainStatusType][] {
  // Sort the chain statuses by the omnichain first block to index timestamp
  chains.sort(
    ([, chainA], [, chainB]) =>
      chainA.config.startBlock.timestamp - chainB.config.startBlock.timestamp,
  );

  return chains;
}
