import type { CrossChainIndexingStatusSnapshot } from "./cross-chain-indexing-status-snapshot";
import { serializeOmnichainIndexingStatusSnapshot } from "./serialize/omnichain-indexing-status-snapshot";
import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedRealtimeIndexingStatusProjection,
} from "./serialized-types";
import type { RealtimeIndexingStatusProjection } from "./types";

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
