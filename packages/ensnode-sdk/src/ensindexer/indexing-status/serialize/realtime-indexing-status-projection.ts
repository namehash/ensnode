import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import type { SerializedCrossChainIndexingStatusSnapshot } from "./cross-chain-indexing-status-snapshot";
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
