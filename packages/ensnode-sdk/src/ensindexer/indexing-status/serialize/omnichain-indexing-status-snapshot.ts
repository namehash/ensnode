import type { ChainIdString } from "../../../shared/serialized-types";
import type {
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";
import {
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type OmnichainIndexingStatusSnapshotUnstarted,
} from "../omnichain-indexing-status-snapshot";
import { serializeChainIndexingSnapshots } from "./chain-indexing-status-snapshot";

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotUnstarted}
 */
export interface SerializedOmnichainIndexingStatusSnapshotUnstarted
  extends Omit<OmnichainIndexingStatusSnapshotUnstarted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusSnapshotQueued>;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotBackfill}
 */
export interface SerializedOmnichainIndexingStatusSnapshotBackfill
  extends Omit<OmnichainIndexingStatusSnapshotBackfill, "chains"> {
  chains: Record<
    ChainIdString,
    ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill
  >;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotCompleted}
 */
export interface SerializedOmnichainIndexingStatusSnapshotCompleted
  extends Omit<OmnichainIndexingStatusSnapshotCompleted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusSnapshotCompleted>;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotFollowing}
 */
export interface SerializedOmnichainIndexingStatusSnapshotFollowing
  extends Omit<OmnichainIndexingStatusSnapshotFollowing, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusSnapshot>;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshot}
 */
export type SerializedOmnichainIndexingStatusSnapshot =
  | SerializedOmnichainIndexingStatusSnapshotUnstarted
  | SerializedOmnichainIndexingStatusSnapshotBackfill
  | SerializedOmnichainIndexingStatusSnapshotCompleted
  | SerializedOmnichainIndexingStatusSnapshotFollowing;

/**
 * Serialize omnichain indexing status snapshot.
 */
export function serializeOmnichainIndexingStatusSnapshot(
  indexingStatus: OmnichainIndexingStatusSnapshot,
): SerializedOmnichainIndexingStatusSnapshot {
  switch (indexingStatus.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotUnstarted;

    case OmnichainIndexingStatusIds.Backfill:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotBackfill;

    case OmnichainIndexingStatusIds.Completed: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotCompleted;
    }

    case OmnichainIndexingStatusIds.Following:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotFollowing;
  }
}
