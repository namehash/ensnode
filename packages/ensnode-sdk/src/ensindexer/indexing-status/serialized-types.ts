import type { ChainIdString, SerializedBlockRef } from "../../shared";
import type { ChainIndexingStatus, ChainIndexingStatuses, ENSIndexerIndexingStatus } from "./types";

/**
 * Serialized representation of {@link ChainIndexingStatus}
 */
export type SerializedChainIndexingStatus = ChainIndexingStatus<SerializedBlockRef>;

/**
 * Serialized representation of {@link ChainIndexingStatuses}
 */
export type SerializedChainIndexingStatuses = Record<ChainIdString, SerializedChainIndexingStatus>;

/**
 * Serialized representation of {@link ENSIndexerIndexingStatus}
 */
export type SerializedENSIndexerIndexingStatus = {
  chains: SerializedChainIndexingStatuses;
};
