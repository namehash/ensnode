import type { ChainIdString } from "../../../shared/serialized-types";
import type {
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";
import type {
  ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  OmnichainIndexingStatusSnapshotBackfill,
  OmnichainIndexingStatusSnapshotCompleted,
  OmnichainIndexingStatusSnapshotFollowing,
  OmnichainIndexingStatusSnapshotUnstarted,
} from "../omnichain-indexing-status-snapshot";

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotUnstarted}
 */
export interface SerializedOmnichainIndexingStatusSnapshotUnstarted
  extends Omit<OmnichainIndexingStatusSnapshotUnstarted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusSnapshotQueued>;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotBackfill}
 */
export interface SerializedOmnichainIndexingStatusSnapshotBackfill
  extends Omit<OmnichainIndexingStatusSnapshotBackfill, "chains"> {
  chains: Record<
    ChainIdString,
    ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill
  >;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotCompleted}
 */
export interface SerializedOmnichainIndexingStatusSnapshotCompleted
  extends Omit<OmnichainIndexingStatusSnapshotCompleted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusSnapshotCompleted>;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshotFollowing}
 */
export interface SerializedOmnichainIndexingStatusSnapshotFollowing
  extends Omit<OmnichainIndexingStatusSnapshotFollowing, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusSnapshot>;
}

/**
 * Serialized representation of {@link OmnichainIndexingStatusSnapshot}
 */
export type SerializedOmnichainIndexingStatusSnapshot =
  | SerializedOmnichainIndexingStatusSnapshotUnstarted
  | SerializedOmnichainIndexingStatusSnapshotBackfill
  | SerializedOmnichainIndexingStatusSnapshotCompleted
  | SerializedOmnichainIndexingStatusSnapshotFollowing;
