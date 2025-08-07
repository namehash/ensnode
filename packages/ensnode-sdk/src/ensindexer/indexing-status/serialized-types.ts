import type { ChainIdString } from "../../shared";
import type { ChainIndexingStatus, ENSIndexerIndexingStatus } from "./types";

/**
 * Serialized representation of {@link ENSIndexerIndexingStatus}
 */
export interface SerializedENSIndexerIndexingStatus
  extends Omit<ENSIndexerIndexingStatus, "chains"> {
  chains: Record<ChainIdString, ChainIndexingStatus>;
}
