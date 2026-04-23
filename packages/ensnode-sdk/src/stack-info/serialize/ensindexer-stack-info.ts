import { serializeEnsIndexerPublicConfig } from "../../ensindexer/config/serialize";
import type { SerializedEnsIndexerPublicConfig } from "../../ensindexer/config/serialized-types";
import type { SerializedEnsRainbowPublicConfig } from "../../ensrainbow/serialize/config";
import type { EnsIndexerStackInfo } from "../ensindexer-stack-info";

/**
 * Serialized representation of {@link EnsIndexerStackInfo}.
 */
export interface SerializedEnsIndexerStackInfo {
  ensIndexer: SerializedEnsIndexerPublicConfig;
  ensRainbow: SerializedEnsRainbowPublicConfig;
}

/**
 * Serialize a {@link EnsIndexerStackInfo} object.
 */
export function serializeEnsIndexerStackInfo(
  stackInfo: EnsIndexerStackInfo,
): SerializedEnsIndexerStackInfo {
  return {
    ensIndexer: serializeEnsIndexerPublicConfig(stackInfo.ensIndexer),
    ensRainbow: stackInfo.ensRainbow,
  };
}
