import type { ChainIdString } from "../../shared";
import type {
  ChainIndexingCompletedStatus,
  ChainIndexingStatus,
  ChainIndexingStatusForBackfillOverallStatus,
  ENSIndexerOverallIndexingBackfillStatus,
  ENSIndexerOverallIndexingCompletedStatus,
  ENSIndexerOverallIndexingErrorStatus,
  ENSIndexerOverallIndexingFollowingStatus,
  ENSIndexerOverallIndexingStatus,
} from "./types";

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingBackfillStatus}
 */
export interface SerializedENSIndexerOverallIndexingBackfillStatus
  extends Omit<ENSIndexerOverallIndexingBackfillStatus, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatusForBackfillOverallStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingCompletedStatus}
 */
export interface SerializedENSIndexerOverallIndexingCompletedStatus
  extends Omit<ENSIndexerOverallIndexingCompletedStatus, "chains"> {
  chains: Record<ChainIdString, ChainIndexingCompletedStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingFollowingStatus}
 */
export interface SerializedENSIndexerOverallIndexingFollowingStatus
  extends Omit<ENSIndexerOverallIndexingFollowingStatus, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingErrorStatus}
 */
export interface SerializedENSIndexerOverallIndexingErrorStatus
  extends ENSIndexerOverallIndexingErrorStatus {}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatus}
 */
export type SerializedENSIndexerOverallIndexingStatus =
  | SerializedENSIndexerOverallIndexingBackfillStatus
  | SerializedENSIndexerOverallIndexingCompletedStatus
  | SerializedENSIndexerOverallIndexingFollowingStatus
  | SerializedENSIndexerOverallIndexingErrorStatus;
