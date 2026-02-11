import {
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "./omnichain-indexing-status-snapshot";
import { serializeChainIndexingSnapshots } from "./serialize/chain-indexing-status-snapshot";
import type {
  SerializedOmnichainIndexingStatusSnapshot,
  SerializedOmnichainIndexingStatusSnapshotBackfill,
  SerializedOmnichainIndexingStatusSnapshotCompleted,
  SerializedOmnichainIndexingStatusSnapshotFollowing,
  SerializedOmnichainIndexingStatusSnapshotUnstarted,
} from "./serialize/omnichain-indexing-status-snapshot";
import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedRealtimeIndexingStatusProjection,
} from "./serialized-types";
import type { CrossChainIndexingStatusSnapshot, RealtimeIndexingStatusProjection } from "./types";

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
