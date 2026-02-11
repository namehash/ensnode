import { serializeCrossChainIndexingStatusSnapshotOmnichain } from "./serialize/cross-chain-indexing-status-snapshot";
import type { SerializedRealtimeIndexingStatusProjection } from "./serialized-types";
import type { RealtimeIndexingStatusProjection } from "./types";

export function serializeRealtimeIndexingStatusProjection(
  indexingProjection: RealtimeIndexingStatusProjection,
): SerializedRealtimeIndexingStatusProjection {
  return {
    projectedAt: indexingProjection.projectedAt,
    worstCaseDistance: indexingProjection.worstCaseDistance,
    snapshot: serializeCrossChainIndexingStatusSnapshotOmnichain(indexingProjection.snapshot),
  } satisfies SerializedRealtimeIndexingStatusProjection;
}
