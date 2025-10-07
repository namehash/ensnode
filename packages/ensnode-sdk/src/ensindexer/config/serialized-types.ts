import type { ChainId } from "../../shared";
import type { ENSIndexerPublicConfig } from "./types";

export type SerializedIndexedChainIds = Array<ChainId>;

/**
 * Serialized representation of {@link ENSIndexerPublicConfig}
 */
export interface SerializedENSIndexerPublicConfig
  extends Omit<ENSIndexerPublicConfig, "indexedChainIds"> {
  /**
   * Array representation of {@link ENSIndexerPublicConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];
}
