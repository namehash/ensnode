import type { BlockRef, ChainId, UnixTimestamp } from "../../shared/types";
import {
  type ChainIndexingConfig,
  type ChainIndexingConfigDefinite,
  type ChainIndexingConfigIndefinite,
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import {
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  type CrossChainIndexingStatusSnapshot,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "./types";

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
 * Get the timestamp of the lowest `config.startBlock` across all chains
 * in the provided array of {@link ChainIndexingStatusSnapshot}.
 *
 * Such timestamp is useful when presenting the "lowest" block
 * to be indexed across all chains.
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
 * Get the timestamp of the "highest known block" across all chains
 * in the provided array of {@link ChainIndexingStatusSnapshot}.
 *
 * Such timestamp is useful when presenting the "highest known block"
 * to be indexed across all chains.
 *
 * The "highest known block" for a chain depends on its status:
 * - `config.endBlock` for a "queued" chain,
 * - `backfillEndBlock` for a "backfill" chain,
 * - `latestIndexedBlock` for a "completed" chain,
 * - `latestKnownBlock` for a "following" chain.
 */
export function getTimestampForHighestOmnichainKnownBlock(
  chains: ChainIndexingStatusSnapshot[],
): UnixTimestamp {
  const latestKnownBlockTimestamps: UnixTimestamp[] = [];

  for (const chain of chains) {
    switch (chain.chainStatus) {
      case ChainIndexingStatusIds.Queued:
        if (
          chain.config.configType === ChainIndexingConfigTypeIds.Definite &&
          chain.config.endBlock
        ) {
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
export function sortChainStatusesByStartBlockAsc<
  ChainStatusType extends ChainIndexingStatusSnapshot,
>(chains: [ChainId, ChainStatusType][]): [ChainId, ChainStatusType][] {
  // Sort the chain statuses by the omnichain first block to index timestamp
  chains.sort(
    ([, chainA], [, chainB]) =>
      chainA.config.startBlock.timestamp - chainB.config.startBlock.timestamp,
  );

  return chains;
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
