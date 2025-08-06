import type { ChainId, UrlString } from "../../shared";
import type { ENSIndexerPublicConfig } from "./types";

export type SerializedIndexedChainIds = Array<ChainId>;

/**
 * Serialized representation of {@link ENSIndexerPublicConfig}
 */
export interface SerializedENSIndexerPublicConfig
  extends Omit<
    ENSIndexerPublicConfig,
    "ensAdminUrl" | "ensNodePublicUrl" | "ensRainbowUrl" | "indexedChainIds"
  > {
  /**
   * String representation of {@link ENSIndexerPublicConfig.ensAdminUrl}.
   */
  ensAdminUrl: UrlString;

  /**
   * String representation of {@link ENSIndexerPublicConfig.ensNodePublicUrl}.
   */
  ensNodePublicUrl: UrlString;

  /**
   * String representation of {@link ENSIndexerPublicConfig.ensRainbowUrl}.
   */
  ensRainbowUrl: UrlString;

  /**
   * Array representation of {@link ENSIndexerPublicConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];
}
