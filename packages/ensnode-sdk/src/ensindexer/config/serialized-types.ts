import type { ChainId } from "@ensnode/datasources";
import type { UrlString } from "../../shared";
import type { ENSIndexerPublicConfig } from "./types";

export type SerializedIndexedChainIds = Array<ChainId>;

/**
 * Serialized representation of {@link ENSIndexerPublicConfig}
 */
export interface SerializedENSIndexerPublicConfig
  extends Omit<ENSIndexerPublicConfig, "ensAdminUrl" | "ensNodePublicUrl" | "indexedChainIds"> {
  /**
   * String representation of {@link ENSIndexerPublicConfig.ensAdminUrl}.
   */
  ensAdminUrl: UrlString;

  /**
   * String representation of {@link ENSIndexerPublicConfig.ensNodePublicUrl}.
   */
  ensNodePublicUrl: UrlString;

  /**
   * Array representation of {@link ENSIndexerPublicConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];
}
