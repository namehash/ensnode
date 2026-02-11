import type { BlockRef, ChainId, UnixTimestamp } from "../../shared/types";
import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import {
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "./omnichain-indexing-status-snapshot";
import type { CrossChainIndexingStatusSnapshot } from "./types";

/**
 * Get {@link OmnichainIndexingStatusId} based on indexed chains' statuses.
 *
 * This function decides what is the `OmnichainIndexingStatusId` is,
 * based on provided chain indexing statuses.
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

  // for omnichain indexing status snapshot 'unstarted', the cursor tracks
  // the moment just before the indexing would start from.
  if (getOmnichainIndexingStatus(chains) === OmnichainIndexingStatusIds.Unstarted) {
    const earliestStartBlockTimestamps = chains.map((chain) => chain.config.startBlock.timestamp);

    return Math.min(...earliestStartBlockTimestamps) - 1;
  }

  // otherwise, the cursor tracks the "highest" latest indexed block timestamp
  // across all indexed chains
  const latestIndexedBlockTimestamps = chains
    .filter((chain) => chain.chainStatus !== ChainIndexingStatusIds.Queued)
    .map((chain) => chain.latestIndexedBlock.timestamp);

  // Invariant: there's at least one element in `latestIndexedBlockTimestamps` array
  // This is theoretically impossible based on the 2 checks above,
  // but the invariant is explicitly added here as a formality.
  if (latestIndexedBlockTimestamps.length < 1) {
    throw new Error("latestIndexedBlockTimestamps array must include at least one element");
  }

  return Math.max(...latestIndexedBlockTimestamps);
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
 * Gets the latest indexed {@link BlockRef} for the given {@link ChainId}.
 *
 * @returns the latest indexed {@link BlockRef} for the given {@link ChainId}, or null if the chain
 *          isn't being indexed at all or is queued and therefore hasn't started indexing yet.
 */
export function getLatestIndexedBlockRef(
  indexingStatus: CrossChainIndexingStatusSnapshot,
  chainId: ChainId,
): BlockRef | null {
  const chainIndexingStatus = indexingStatus.omnichainSnapshot.chains.get(chainId);

  if (chainIndexingStatus === undefined) {
    // chain isn't being indexed at all
    return null;
  }

  if (chainIndexingStatus.chainStatus === ChainIndexingStatusIds.Queued) {
    // chain is queued, so no data for the chain has been indexed yet
    return null;
  }

  return chainIndexingStatus.latestIndexedBlock;
}
