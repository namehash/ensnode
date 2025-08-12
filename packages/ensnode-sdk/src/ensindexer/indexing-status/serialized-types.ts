import type { ChainIdString } from "../../shared";
import type {
  ChainIndexingCompletedStatus,
  ChainIndexingStatus,
  ENSIndexerOverallIndexingStatus,
  ENSIndexerOverallIndexingStatusBackfill,
  ENSIndexerOverallIndexingStatusCompleted,
  ENSIndexerOverallIndexingStatusError,
  ENSIndexerOverallIndexingStatusFollowing,
} from "./types";

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatusBackfill}
 */
export interface SerializedENSIndexerOverallIndexingStatusBackfill
  extends Omit<ENSIndexerOverallIndexingStatusBackfill, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatusCompleted}
 */
export interface SerializedENSIndexerOverallIndexingStatusCompleted
  extends Omit<ENSIndexerOverallIndexingStatusCompleted, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatusFollowing}
 */
export interface SerializedENSIndexerOverallIndexingStatusFollowing
  extends Omit<ENSIndexerOverallIndexingStatusFollowing, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatusError}
 */
export interface SerializedENSIndexerOverallIndexingStatusError
  extends ENSIndexerOverallIndexingStatusError {}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatus}
 */
export type SerializedENSIndexerOverallIndexingStatus =
  | SerializedENSIndexerOverallIndexingStatusBackfill
  | SerializedENSIndexerOverallIndexingStatusCompleted
  | SerializedENSIndexerOverallIndexingStatusFollowing
  | SerializedENSIndexerOverallIndexingStatusError;
