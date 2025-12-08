import type { SerializedENSIndexerPublicConfig } from "../../ensindexer";
import type { ENSApiPublicConfig } from "./types";

/**
 * Serialized representation of {@link ENSApiPublicConfig}
 */
export interface SerializedENSApiPublicConfig
  extends Omit<ENSApiPublicConfig, "ensIndexerPublicConfig"> {
  /**
   * Serialized representation of {@link ENSApiPublicConfig.ensIndexerPublicConfig}.
   */
  ensIndexerPublicConfig: SerializedENSIndexerPublicConfig;
}
