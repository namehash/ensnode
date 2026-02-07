import type { ChainId, UnixTimestamp } from "../../shared/types";
import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import {
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
} from "./validate/omnichain-indexing-status-snapshot";

/**
 * The status of omnichain indexing at the time an omnichain indexing status
 * snapshot is captured.
 */
export const OmnichainIndexingStatusIds = {
  /**
   * Represents that omnichain indexing is not ready to begin yet because
   * ENSIndexer is in its initialization phase and the data to build a "true"
   * {@link OmnichainIndexingStatusSnapshot} is still being loaded.
   */
  Unstarted: "omnichain-unstarted",

  /**
   * Represents that omnichain indexing is in an overall "backfill" status because
   * - At least one indexed chain has a `chainStatus` of
   *   {@link ChainIndexingStatusIds.Backfill}; and
   * - No indexed chain has a `chainStatus` of {@link ChainIndexingStatusIds.Following}.
   */
  Backfill: "omnichain-backfill",

  /**
   * Represents that omnichain indexing is in an overall "following" status because
   * at least one indexed chain has a `chainStatus` of
   * {@link ChainIndexingStatusIds.Following}.
   */
  Following: "omnichain-following",

  /**
   * Represents that omnichain indexing has completed because all indexed chains have
   * a `chainStatus` of {@link ChainIndexingStatusIds.Completed}.
   */
  Completed: "omnichain-completed",
} as const;

/**
 * The derived string union of possible {@link OmnichainIndexingStatusIds}.
 */
export type OmnichainIndexingStatusId =
  (typeof OmnichainIndexingStatusIds)[keyof typeof OmnichainIndexingStatusIds];

/**
 * Omnichain indexing status snapshot when the overall `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Unstarted}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Unstarted}.
 * - `chains` is always a map to {@link ChainIndexingStatusSnapshotQueued} values exclusively.
 * - `omnichainIndexingCursor` is always < the `config.startBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Queued}.
 */
export interface OmnichainIndexingStatusSnapshotUnstarted {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Unstarted;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshotQueued>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * The range of {@link ChainIndexingSnapshot} types allowed when the
 * overall omnichain indexing status is {@link OmnichainIndexingStatusIds.Backfill}.
 *
 * Note that this is all of the {@link ChainIndexingSnapshot} types with the exception
 * of {@link ChainIndexingStatusSnapshotFollowing}.
 */
export type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill =
  | ChainIndexingStatusSnapshotQueued
  | ChainIndexingStatusSnapshotBackfill
  | ChainIndexingStatusSnapshotCompleted;

/**
 * Omnichain indexing status snapshot when the `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Backfill}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Backfill}.
 * - `chains` is guaranteed to contain at least one chain with a `chainStatus` of
 *   {@link ChainIndexingStatusIds.Backfill}.
 * - `chains` is guaranteed to not to contain any chain with a `chainStatus` of
 *   {@link ChainIndexingStatusIds.Following}
 * - `omnichainIndexingCursor` is always < the `config.startBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Queued}.
 * - `omnichainIndexingCursor` is always <= the `backfillEndBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Backfill}.
 * - `omnichainIndexingCursor` is always >= the `latestIndexedBlock.timestamp` for all
 *    chains with `chainStatus` of {@link ChainIndexingStatusIds.Completed}.
 * - `omnichainIndexingCursor` is always equal to the timestamp of the highest
 *   `latestIndexedBlock` across all chains that have started indexing
 *   (`chainStatus` is not {@link ChainIndexingStatusIds.Queued}).
 */
export interface OmnichainIndexingStatusSnapshotBackfill {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Backfill;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * Omnichain indexing status snapshot when the overall `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Following}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Following}.
 * - `chains` is guaranteed to contain at least one chain with a `status` of
 *   {@link ChainIndexingStatusIds.Following}.
 * - `omnichainIndexingCursor` is always < the `config.startBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Queued}.
 * - `omnichainIndexingCursor` is always <= the `backfillEndBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Backfill}.
 * - `omnichainIndexingCursor` is always >= the `latestIndexedBlock.timestamp` for all
 *    chains with `chainStatus` of {@link ChainIndexingStatusIds.Completed}.
 * - `omnichainIndexingCursor` is always equal to the timestamp of the highest
 *   `latestIndexedBlock` across all chains that have started indexing
 *   (`chainStatus` is not {@link ChainIndexingStatusIds.Queued}).
 */
export interface OmnichainIndexingStatusSnapshotFollowing {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Following;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshot>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * Omnichain indexing status snapshot when the overall `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Completed}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Completed}.
 * - `chains` is always a map to {@link ChainIndexingStatusSnapshotCompleted} values exclusively.
 * - `omnichainIndexingCursor` is always equal to the highest
 *   `latestIndexedBlock.timestamp` for all chains.
 */
export interface OmnichainIndexingStatusSnapshotCompleted {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Completed;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshotCompleted>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * Omnichain indexing status snapshot for one or more chains.
 *
 * Use the `omnichainStatus` field to determine the specific type interpretation
 * at runtime.
 */
export type OmnichainIndexingStatusSnapshot =
  | OmnichainIndexingStatusSnapshotUnstarted
  | OmnichainIndexingStatusSnapshotBackfill
  | OmnichainIndexingStatusSnapshotCompleted
  | OmnichainIndexingStatusSnapshotFollowing;

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
