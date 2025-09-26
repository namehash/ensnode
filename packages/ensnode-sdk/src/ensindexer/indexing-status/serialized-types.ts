import type { ChainIdString } from "../../shared";
import type {
  ChainIndexingSnapshot,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill,
  ChainIndexingSnapshotQueued,
  CurrentIndexingProjection,
  CurrentIndexingProjectionOmnichain,
  CurrentIndexingProjectionUnavailable,
  OmnichainIndexingSnapshot,
  OmnichainIndexingSnapshotBackfill,
  OmnichainIndexingSnapshotCompleted,
  OmnichainIndexingSnapshotFollowing,
  OmnichainIndexingSnapshotUnstarted,
} from "./types";

/**
 * Serialized representation of {@link ChainIndexingSnapshot}
 */
export type SerializedChainIndexingSnapshot = ChainIndexingSnapshot;

/**
 * Serialized representation of {@link ChainIndexingSnapshotQueued}
 */
export type SerializedChainIndexingSnapshotQueued = ChainIndexingSnapshotQueued;

/**
 * Serialized representation of {@link ChainIndexingSnapshotBackfill}
 */
export type SerializedChainIndexingSnapshotBackfill = ChainIndexingSnapshotBackfill;

/**
 * Serialized representation of {@link ChainIndexingSnapshotCompleted}
 */
export type SerializedChainIndexingSnapshotCompleted = ChainIndexingSnapshotCompleted;

/**
 * Serialized representation of {@link ChainIndexingSnapshotFollowing}
 */
export type SerializedChainIndexingSnapshotFollowing = ChainIndexingSnapshotFollowing;

/**
 * Serialized representation of {@link OmnichainIndexingSnapshotUnstarted}
 */
export interface SerializedOmnichainIndexingSnapshotUnstarted
  extends Omit<OmnichainIndexingSnapshotUnstarted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingSnapshotQueued>;
}

/**
 * Serialized representation of {@link OmnichainIndexingSnapshotBackfill}
 */
export interface SerializedOmnichainIndexingSnapshotBackfill
  extends Omit<OmnichainIndexingSnapshotBackfill, "chains"> {
  chains: Record<ChainIdString, ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill>;
}

/**
 * Serialized representation of {@link OmnichainIndexingSnapshotCompleted}
 */
export interface SerializedOmnichainIndexingSnapshotCompleted
  extends Omit<OmnichainIndexingSnapshotCompleted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingSnapshotCompleted>;
}

/**
 * Serialized representation of {@link OmnichainIndexingSnapshotFollowing}
 */
export interface SerializedOmnichainIndexingSnapshotFollowing
  extends Omit<OmnichainIndexingSnapshotFollowing, "chains"> {
  chains: Record<ChainIdString, ChainIndexingSnapshot>;
}

/**
 * Serialized representation of {@link OmnichainIndexingSnapshot}
 */
export type SerializedOmnichainIndexingSnapshot =
  | SerializedOmnichainIndexingSnapshotUnstarted
  | SerializedOmnichainIndexingSnapshotBackfill
  | SerializedOmnichainIndexingSnapshotCompleted
  | SerializedOmnichainIndexingSnapshotFollowing;

/**
 * Serialized representation of {@link CurrentIndexingProjectionOmnichain}
 */
export interface SerializedCurrentIndexingProjectionOmnichain
  extends Omit<CurrentIndexingProjectionOmnichain, "snapshot"> {
  snapshot: SerializedOmnichainIndexingSnapshot;
}

/**
 * Serialized representation of {@link CurrentIndexingProjectionUnavailable}
 */
export type SerializedCurrentIndexingProjectionUnavailable = CurrentIndexingProjectionUnavailable;

/**
 * Serialized representation of {@link CurrentIndexingProjection}
 */
export type SerializedCurrentIndexingProjection =
  | SerializedCurrentIndexingProjectionOmnichain
  | SerializedCurrentIndexingProjectionUnavailable;
