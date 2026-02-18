import type { SerializedEnsIndexerPublicConfig } from "../../ensindexer/config/serialized-types";
import type { EnsApiPublicConfig } from "./types";

/**
 * Serialized representation of {@link EnsApiPublicConfig}
 */
export interface SerializedEnsApiPublicConfig
  extends Omit<EnsApiPublicConfig, "ensIndexerPublicConfig"> {
  /**
   * Serialized representation of {@link EnsApiPublicConfig.ensIndexerPublicConfig}.
   */
  ensIndexerPublicConfig: SerializedEnsIndexerPublicConfig;
}

/**
 * Serialized representation of {@link EnsApiPublicConfig}
 *
 * @deprecated Use {@link SerializedEnsApiPublicConfig} instead.
 */
export type SerializedENSApiPublicConfig = SerializedEnsApiPublicConfig;
