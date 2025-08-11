import type { ChainIdString } from "../../shared";
import type {
  ChainIndexingStatus,
  ENSIndexerOverallIndexingStatus,
  ENSIndexerOverallIndexingStatusError,
  ENSIndexerOverallIndexingStatusOk,
  ENSIndexerOverallIndexingStatusOkFollowing,
} from "./types";

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatusOk}
 */
export interface SerializedENSIndexerOverallIndexingStatusOk
  extends Omit<ENSIndexerOverallIndexingStatus, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerOverallIndexingStatusOkFollowing}
 */
export interface SerializedENSIndexerOverallIndexingStatusOkFollowing
  extends Omit<ENSIndexerOverallIndexingStatusOkFollowing, "chains"> {
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
  | SerializedENSIndexerOverallIndexingStatusOk
  | SerializedENSIndexerOverallIndexingStatusOkFollowing
  | SerializedENSIndexerOverallIndexingStatusError;
