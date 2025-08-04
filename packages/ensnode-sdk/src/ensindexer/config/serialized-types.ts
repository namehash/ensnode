import type { ChainId, UrlString } from "../../shared";
import type { ENSIndexerPublicConfig } from "./types";

export type SerializedIndexedChainIds = Array<ChainId>;

/**
 * Serialized representation of {@link ENSIndexerPublicConfig}
 */
export type SerializedENSIndexerPublicConfig = ENSIndexerPublicConfig<
  UrlString,
  SerializedIndexedChainIds
>;
