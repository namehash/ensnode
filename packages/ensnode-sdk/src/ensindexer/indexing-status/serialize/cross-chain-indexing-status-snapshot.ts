import type {
  CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStatusSnapshotOmnichain,
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
}: CrossChainIndexingStatusSnapshot): SerializedCrossChainIndexingStatusSnapshot {
  return {
    strategy,
    slowestChainIndexingCursor,
    snapshotTime,
    omnichainSnapshot: serializeOmnichainIndexingStatusSnapshot(omnichainSnapshot),
  };
}
