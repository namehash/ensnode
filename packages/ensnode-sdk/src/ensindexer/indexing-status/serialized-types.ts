import type { ChainIdString } from "../../shared";
import type { ChainIndexingStatus, ENSIndexerIndexingStatus } from "./types";

/**
 * Serialized representation of {@link ENSIndexerIndexingStatus}
 */
export type SerializedENSIndexerIndexingStatus = {
  chains: Record<ChainIdString, ChainIndexingStatus>;
};
