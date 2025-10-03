import { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";
import {
  ChainIndexingConfig,
  ChainIndexingConfigDefinite,
  ChainIndexingConfigIndefinite,
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotQueued,
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
  chains: ChainIndexingStatusSnapshot[],
): OmnichainIndexingStatusId {
  if (checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing(chains)) {
    return OmnichainIndexingStatusIds.Following;
  }

  if (checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill(chains)) {
    return OmnichainIndexingStatusIds.Backfill;
  }

  if (checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted(chains)) {
    return OmnichainIndexingStatusIds.Unstarted;
  }

  if (checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted(chains)) {
    return OmnichainIndexingStatusIds.Completed;
  }

  // if none of the chain statuses matched, throw an error
  throw new Error(`Unable to determine omnichain indexing status for provided chains.`);
}

/**
 * Get lowest of the highest end block across all chains which status is
 * {@link ChainIndexingStatusSnapshot}.
 */
export function getTimestampForLowestOmnichainStartBlock(
  chains: ChainIndexingStatusSnapshot[],
): UnixTimestamp {
  const earliestKnownBlockTimestamps: UnixTimestamp[] = chains.map(
    (chain) => chain.config.startBlock.timestamp,
  );

  return Math.min(...earliestKnownBlockTimestamps);
}

/**
 * Get timestamp of the highest known block across all chains which status is
 * {@link ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill}.
 */
export function getTimestampForHighestOmnichainKnownBlock(
  chains: ChainIndexingStatusSnapshot[],
): UnixTimestamp {
  const latestKnownBlockTimestamps: UnixTimestamp[] = [];

  for (const chain of chains) {
    switch (chain.chainStatus) {
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
export function getOmnichainIndexingCursor(chains: ChainIndexingStatusSnapshot[]): UnixTimestamp {
  if (chains.length === 0) {
    throw new Error(`Unable to determine omnichain indexing cursor when no chains were provided.`);
  }

  // if all chains are queued, the cursor tracks the moment just before
  if (chains.every((chain) => chain.chainStatus === ChainIndexingStatusIds.Queued)) {
    // the earliest start block timestamp across those chains
    const earliestStartBlockTimestamps = chains.map((chain) => chain.config.startBlock.timestamp);

    return Math.min(...earliestStartBlockTimestamps) - 1;
  }

  // otherwise, the cursor tracks the "highest" latest indexed block timestamp
  // across all indexed chains
  const latestIndexedBlockTimestamps = chains
    .filter((chain) => chain.chainStatus !== ChainIndexingStatusIds.Queued)
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
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock,
      endBlock,
    } satisfies ChainIndexingConfigDefinite;
  }

  return {
    configType: ChainIndexingConfigTypeIds.Indefinite,
    startBlock,
    endBlock: null,
  } satisfies ChainIndexingConfigIndefinite;
}

/**
 * Check if Chain Indexing Status Snapshots fit the 'unstarted' overall status
 * snapshot requirements:
 * - All chains are guaranteed to have a status of "queued".
 *
 * Note: This function narrows the {@link ChainIndexingStatusSnapshot} type to
 * {@link ChainIndexingStatusSnapshotQueued}.
 */
export function checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted(
  chains: ChainIndexingStatusSnapshot[],
): chains is ChainIndexingStatusSnapshotQueued[] {
  return chains.every((chain) => chain.chainStatus === ChainIndexingStatusIds.Queued);
}

/**
 * Check if Chain Indexing Status Snapshots fit the 'backfill' overall status
 * snapshot requirements:
 * - At least one chain is guaranteed to be in the "backfill" status.
 * - Each chain is guaranteed to have a status of either "queued",
 *   "backfill" or "completed".
 *
 * Note: This function narrows the {@link ChainIndexingStatusSnapshot} type to
 * {@link ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill}.
 */
export function checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill(
  chains: ChainIndexingStatusSnapshot[],
): chains is ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill[] {
  const atLeastOneChainInTargetStatus = chains.some(
    (chain) => chain.chainStatus === ChainIndexingStatusIds.Backfill,
  );
  const otherChainsHaveValidStatuses = chains.every(
    (chain) =>
      chain.chainStatus === ChainIndexingStatusIds.Queued ||
      chain.chainStatus === ChainIndexingStatusIds.Backfill ||
      chain.chainStatus === ChainIndexingStatusIds.Completed,
  );

  return atLeastOneChainInTargetStatus && otherChainsHaveValidStatuses;
}

/**
 * Checks if Chain Indexing Status Snapshots fit the 'completed' overall status
 * snapshot requirements:
 * - All chains are guaranteed to have a status of "completed".
 *
 * Note: This function narrows the {@link ChainIndexingStatusSnapshot} type to
 * {@link ChainIndexingStatusSnapshotCompleted}.
 */
export function checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted(
  chains: ChainIndexingStatusSnapshot[],
): chains is ChainIndexingStatusSnapshotCompleted[] {
  const allChainsHaveValidStatuses = chains.every(
    (chain) => chain.chainStatus === ChainIndexingStatusIds.Completed,
  );

  return allChainsHaveValidStatuses;
}

/**
 * Checks Chain Indexing Status Snapshots fit the 'following' overall status
 * snapshot requirements:
 * - At least one chain is guaranteed to be in the "following" status.
 * - Any other chain can have any status.
 */
export function checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing(
  chains: ChainIndexingStatusSnapshot[],
): chains is ChainIndexingStatusSnapshot[] {
  const allChainsHaveValidStatuses = chains.some(
    (chain) => chain.chainStatus === ChainIndexingStatusIds.Following,
  );

  return allChainsHaveValidStatuses;
}

/**
 * Sort a list of [{@link ChainId}, {@link ChainIndexingStatusSnapshot}] tuples
 * by the omnichain start block timestamp in ascending order.
 */
export function sortAscChainStatusesByStartBlock<
  ChainStatusType extends ChainIndexingStatusSnapshot,
>(chains: [ChainId, ChainStatusType][]): [ChainId, ChainStatusType][] {
  // Sort the chain statuses by the omnichain first block to index timestamp
  chains.sort(
    ([, chainA], [, chainB]) =>
      chainA.config.startBlock.timestamp - chainB.config.startBlock.timestamp,
  );

  return chains;
}
