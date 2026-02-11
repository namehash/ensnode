import type { RealtimeIndexingStatusProjection } from "./realtime-indexing-status-projection";
import { serializeCrossChainIndexingStatusSnapshotOmnichain } from "./serialize/cross-chain-indexing-status-snapshot";
import type { SerializedRealtimeIndexingStatusProjection } from "./serialize/realtime-indexing-status-projection";

export function serializeRealtimeIndexingStatusProjection(
  indexingProjection: RealtimeIndexingStatusProjection,
): SerializedRealtimeIndexingStatusProjection {
  return {
    projectedAt: indexingProjection.projectedAt,
    worstCaseDistance: indexingProjection.worstCaseDistance,
    snapshot: serializeCrossChainIndexingStatusSnapshotOmnichain(indexingProjection.snapshot),
  } satisfies SerializedRealtimeIndexingStatusProjection;
}
