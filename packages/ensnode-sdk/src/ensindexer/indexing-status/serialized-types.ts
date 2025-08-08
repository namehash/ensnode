import type { ChainIdString } from "../../shared";
import type {
  ChainIndexingStatus,
  ENSIndexerIndexingStatus,
  ENSIndexerIndexingStatusError,
} from "./types";

/**
 * Serialized representation of {@link ENSIndexerIndexingStatus}
 */
export interface SerializedENSIndexerIndexingStatus
  extends Omit<ENSIndexerIndexingStatus, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}

/**
 * Serialized representation of {@link ENSIndexerIndexingStatusError}
 */
export interface SerializedENSIndexerIndexingStatusError extends ENSIndexerIndexingStatusError {}
