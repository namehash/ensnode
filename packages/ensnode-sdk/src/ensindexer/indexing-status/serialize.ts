import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedCurrentIndexingProjectionOmnichain,
  SerializedOmnichainIndexingStatusSnapshot,
  SerializedOmnichainIndexingStatusSnapshotBackfill,
  SerializedOmnichainIndexingStatusSnapshotCompleted,
  SerializedOmnichainIndexingStatusSnapshotFollowing,
  SerializedOmnichainIndexingStatusSnapshotUnstarted,
  SerializedRealtimeIndexingStatusProjection,
} from "./serialized-types";
import {
  ChainIndexingStatusSnapshot,
  CrossChainIndexingStatusSnapshot,
  OmnichainIndexingStatusIds,
  OmnichainIndexingStatusSnapshot,
  RealtimeIndexingStatusProjection,
} from "./types";

export function serializeCrossChainIndexingStatusSnapshotOmnichain({
  strategy,
  slowestChainIndexingCursor,
  snapshotTime,
  omnichainSnapshot,
}: CrossChainIndexingStatusSnapshot): SerializedCrossChainIndexingStatusSnapshot {
  return {
    strategy,
    slowestChainIndexingCursor,
    snapshotTime,
    omnichainSnapshot: serializeOmnichainIndexingStatusSnapshot(omnichainSnapshot),
  };
}

export function serializeRealtimeIndexingStatusProjection(
  indexingProjection: RealtimeIndexingStatusProjection,
): SerializedRealtimeIndexingStatusProjection {
  return {
    projectedAt: indexingProjection.projectedAt,
    worstCaseDistance: indexingProjection.worstCaseDistance,
    snapshot: serializeCrossChainIndexingStatusSnapshotOmnichain(indexingProjection.snapshot),
  } satisfies SerializedRealtimeIndexingStatusProjection;
}

/**
 * Serialize chain indexing snapshots.
 */
export function serializeChainIndexingSnapshots<
  ChainIndexingStatusSnapshotType extends ChainIndexingStatusSnapshot,
>(
  chains: Map<ChainId, ChainIndexingStatusSnapshotType>,
): Record<ChainIdString, ChainIndexingStatusSnapshotType> {
  const serializedSnapshots: Record<ChainIdString, ChainIndexingStatusSnapshotType> = {};

  for (const [chainId, snapshot] of chains.entries()) {
    serializedSnapshots[serializeChainId(chainId)] = snapshot;
  }

  return serializedSnapshots;
}

/**
 * Serialize a {@link OmnichainIndexingStatusSnapshot} object.
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
