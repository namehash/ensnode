import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import {
  type SerializedCrossChainIndexingStatusSnapshot,
  serializeCrossChainIndexingStatusSnapshotOmnichain,
} from "./cross-chain-indexing-status-snapshot";
import type { SerializedOmnichainIndexingStatusSnapshot } from "./omnichain-indexing-status-snapshot";

/**
 * Serialized representation of {@link RealtimeIndexingStatusProjection}
 */
export interface SerializedCurrentIndexingProjectionOmnichain
  extends Omit<RealtimeIndexingStatusProjection, "snapshot"> {
  snapshot: SerializedOmnichainIndexingStatusSnapshot;
}

/**
 * Serialized representation of {@link RealtimeIndexingStatusProjection}
 */
export interface SerializedRealtimeIndexingStatusProjection
  extends Omit<RealtimeIndexingStatusProjection, "snapshot"> {
  snapshot: SerializedCrossChainIndexingStatusSnapshot;
}

/**
 * Serialize realtime indexing status projection.
 */
export function serializeRealtimeIndexingStatusProjection(
  indexingProjection: RealtimeIndexingStatusProjection,
): SerializedRealtimeIndexingStatusProjection {
  return {
    projectedAt: indexingProjection.projectedAt,
    worstCaseDistance: indexingProjection.worstCaseDistance,
    snapshot: serializeCrossChainIndexingStatusSnapshotOmnichain(indexingProjection.snapshot),
  } satisfies SerializedRealtimeIndexingStatusProjection;
}
