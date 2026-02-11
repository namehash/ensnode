import type { SerializedCrossChainIndexingStatusSnapshot } from "./serialize/cross-chain-indexing-status-snapshot";
import type { SerializedOmnichainIndexingStatusSnapshot } from "./serialize/omnichain-indexing-status-snapshot";
import type { RealtimeIndexingStatusProjection } from "./types";

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
