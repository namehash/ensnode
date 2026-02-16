import {
  type CrossChainIndexingStatusSnapshot,
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
} from "../cross-chain-indexing-status-snapshot";
import {
  type SerializedOmnichainIndexingStatusSnapshot,
  serializeOmnichainIndexingStatusSnapshot,
} from "./omnichain-indexing-status-snapshot";

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

export function serializeCrossChainIndexingStatusSnapshotOmnichain({
  strategy,
  slowestChainIndexingCursor,
  snapshotTime,
  omnichainSnapshot,
}: CrossChainIndexingStatusSnapshotOmnichain): SerializedCrossChainIndexingStatusSnapshotOmnichain {
  return {
    strategy,
    slowestChainIndexingCursor,
    snapshotTime,
    omnichainSnapshot: serializeOmnichainIndexingStatusSnapshot(omnichainSnapshot),
  };
}

export function serializeCrossChainIndexingStatusSnapshot(
  snapshot: CrossChainIndexingStatusSnapshot,
): SerializedCrossChainIndexingStatusSnapshot {
  switch (snapshot.strategy) {
    case CrossChainIndexingStrategyIds.Omnichain:
      return serializeCrossChainIndexingStatusSnapshotOmnichain(snapshot);
  }
}
