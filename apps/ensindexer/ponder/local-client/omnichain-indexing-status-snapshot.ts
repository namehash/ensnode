import {
  type ChainIdString,
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
  OmnichainIndexingStatusIds,
  type SerializedChainIndexingStatusSnapshot,
  type SerializedChainIndexingStatusSnapshotCompleted,
  type SerializedChainIndexingStatusSnapshotQueued,
  type SerializedOmnichainIndexingStatusSnapshot,
  type SerializedOmnichainIndexingStatusSnapshotBackfill,
  type SerializedOmnichainIndexingStatusSnapshotCompleted,
  type SerializedOmnichainIndexingStatusSnapshotFollowing,
  type SerializedOmnichainIndexingStatusSnapshotUnstarted,
} from "@ensnode/ensnode-sdk";

/**
 * Create Serialized Omnichain Indexing Snapshot
 *
 * Creates {@link SerializedOmnichainIndexingStatusSnapshot} from serialized chain snapshots.
 */
export function createSerializedOmnichainIndexingStatusSnapshot(
  serializedChainSnapshots: Record<ChainIdString, SerializedChainIndexingStatusSnapshot>,
): SerializedOmnichainIndexingStatusSnapshot {
  const chains = Object.values(serializedChainSnapshots);
  const omnichainStatus = getOmnichainIndexingStatus(chains);
  const omnichainIndexingCursor = getOmnichainIndexingCursor(chains);

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingStatusSnapshotQueued
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotUnstarted;
    }

    case OmnichainIndexingStatusIds.Backfill: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotBackfill;
    }

    case OmnichainIndexingStatusIds.Completed: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: serializedChainSnapshots as Record<
          ChainIdString,
          SerializedChainIndexingStatusSnapshotCompleted
        >, // forcing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotCompleted;
    }

    case OmnichainIndexingStatusIds.Following:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: serializedChainSnapshots,
        omnichainIndexingCursor,
      } satisfies SerializedOmnichainIndexingStatusSnapshotFollowing;
  }
}
