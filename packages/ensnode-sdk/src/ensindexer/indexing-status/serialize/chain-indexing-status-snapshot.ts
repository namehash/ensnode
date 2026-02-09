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
