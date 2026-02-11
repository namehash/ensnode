import type { CrossChainIndexingStatusSnapshotOmnichain } from "./cross-chain-indexing-status-snapshot";
import type { SerializedOmnichainIndexingStatusSnapshot } from "./serialize/omnichain-indexing-status-snapshot";
import type { RealtimeIndexingStatusProjection } from "./types";

/**
 * Serialized representation of {@link CrossChainIndexingStatusSnapshotOmnichain}
 */
export interface SerializedCrossChainIndexingStatusSnapshotOmnichain
  extends Omit<CrossChainIndexingStatusSnapshotOmnichain, "omnichainSnapshot"> {
  omnichainSnapshot: SerializedOmnichainIndexingStatusSnapshot;
}

/**
 * Serialized representation of {@link CrossChainIndexingStatusSnapshot}
 */
export type SerializedCrossChainIndexingStatusSnapshot =
  SerializedCrossChainIndexingStatusSnapshotOmnichain;

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
