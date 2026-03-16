import { serializeChainId } from "../../shared/serialize";
import type { ChainIdString } from "../../shared/serialized-types";
import type { ChainId } from "../../shared/types";
import type {
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";

/**
 * Serialized representation of {@link ChainIndexingStatusSnapshot}
 */
export type SerializedChainIndexingStatusSnapshot = ChainIndexingStatusSnapshot;

/**
 * Serialized representation of {@link ChainIndexingStatusSnapshotQueued}
 */
export type SerializedChainIndexingStatusSnapshotQueued = ChainIndexingStatusSnapshotQueued;

/**
 * Serialized representation of {@link ChainIndexingStatusSnapshotBackfill}
 */
export type SerializedChainIndexingStatusSnapshotBackfill = ChainIndexingStatusSnapshotBackfill;

/**
 * Serialized representation of {@link ChainIndexingStatusSnapshotCompleted}
 */
export type SerializedChainIndexingStatusSnapshotCompleted = ChainIndexingStatusSnapshotCompleted;

/**
 * Serialized representation of {@link ChainIndexingStatusSnapshotFollowing}
 */
export type SerializedChainIndexingStatusSnapshotFollowing = ChainIndexingStatusSnapshotFollowing;

/**
 * Serialize chain indexing status snapshots.
 */
export function serializeChainIndexingSnapshots<
  ChainIndexingStatusSnapshotType extends ChainIndexingStatusSnapshot,
>(
  chains: Map<ChainId, ChainIndexingStatusSnapshotType>,
): Record<ChainIdString, ChainIndexingStatusSnapshotType> {
  const serializedSnapshots: Record<ChainIdString, ChainIndexingStatusSnapshotType> = {};

  for (const [chainId, snapshot] of chains.entries()) {
    serializedSnapshots[serializeChainId(chainId)] = snapshot;
  }

  return serializedSnapshots;
}
