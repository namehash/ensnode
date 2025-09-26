import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedCurrentIndexingProjection,
  SerializedCurrentIndexingProjectionOmnichain,
  SerializedCurrentIndexingProjectionUnavailable,
  SerializedOmnichainIndexingSnapshot,
  SerializedOmnichainIndexingSnapshotBackfill,
  SerializedOmnichainIndexingSnapshotCompleted,
  SerializedOmnichainIndexingSnapshotFollowing,
  SerializedOmnichainIndexingSnapshotUnstarted,
} from "./serialized-types";
import {
  ChainIndexingSnapshot,
  CurrentIndexingProjection,
  OmnichainIndexingSnapshot,
  OmnichainIndexingStatusIds,
} from "./types";

export function serializedCurrentIndexingProjection(
  indexingProjection: CurrentIndexingProjection,
): SerializedCurrentIndexingProjection {
  if (indexingProjection.type === null) {
    return {
      type: null,
      realtime: indexingProjection.realtime,
      snapshot: null,
      maxRealtimeDistance: null,
    } satisfies SerializedCurrentIndexingProjectionUnavailable;
  }

  return {
    type: indexingProjection.type,
    realtime: indexingProjection.realtime,
    snapshot: serializeOmnichainIndexingSnapshot(indexingProjection.snapshot),
    maxRealtimeDistance: indexingProjection.maxRealtimeDistance,
  } satisfies SerializedCurrentIndexingProjectionOmnichain;
}

/**
 * Serialize chain indexing snapshots.
 */
export function serializeChainIndexingSnapshots<
  ChainIndexingSnapshotType extends ChainIndexingSnapshot,
>(
  chains: Map<ChainId, ChainIndexingSnapshotType>,
): Record<ChainIdString, ChainIndexingSnapshotType> {
  const serializedSnapshots: Record<ChainIdString, ChainIndexingSnapshotType> = {};

  for (const [chainId, snapshot] of chains.entries()) {
    serializedSnapshots[serializeChainId(chainId)] = snapshot;
  }

  return serializedSnapshots;
}

/**
 * Serialize a {@link ENSIndexerIndexingStatus} object.
 */
export function serializeOmnichainIndexingSnapshot(
  indexingStatus: OmnichainIndexingSnapshot,
): SerializedOmnichainIndexingSnapshot {
  switch (indexingStatus.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
        snapshotTime: indexingStatus.snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotUnstarted;

    case OmnichainIndexingStatusIds.Backfill:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
        snapshotTime: indexingStatus.snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotBackfill;

    case OmnichainIndexingStatusIds.Completed: {
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
        snapshotTime: indexingStatus.snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotCompleted;
    }

    case OmnichainIndexingStatusIds.Following:
      return {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: serializeChainIndexingSnapshots(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
        snapshotTime: indexingStatus.snapshotTime,
      } satisfies SerializedOmnichainIndexingSnapshotFollowing;
  }
}
