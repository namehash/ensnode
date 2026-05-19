import type { SerializedEnsDbPublicConfig } from "../../ensdb/serialize/config";
import { serializeEnsIndexerPublicConfig } from "../../ensindexer/config/serialize";
import type { SerializedEnsIndexerPublicConfig } from "../../ensindexer/config/serialized-types";
import type { SerializedEnsRainbowPublicConfig } from "../../ensrainbow/serialize/config";
import type { EnsIndexerStackInfo } from "../ensindexer-stack-info";

/**
 * Serialized representation of {@link EnsIndexerStackInfo}.
 */
export interface SerializedEnsIndexerStackInfo {
  ensDb: SerializedEnsDbPublicConfig;
  ensIndexer: SerializedEnsIndexerPublicConfig;
  ensRainbow: SerializedEnsRainbowPublicConfig;
}

/**
 * Serialize a {@link EnsIndexerStackInfo} object.
 */
export function serializeEnsIndexerStackInfo(
  stackInfo: EnsIndexerStackInfo,
): SerializedEnsIndexerStackInfo {
  // `ensDb` and `ensRainbow` are already in a serialized form, so we can include them directly
  const {
    ensDb: serializedEnsDbPublicConfig,
    ensRainbow: serializedEnsRainbowPublicConfig,
    ensIndexer,
  } = stackInfo;
  const serializedEnsIndexerPublicConfig = serializeEnsIndexerPublicConfig(ensIndexer);

  return {
    ensDb: serializedEnsDbPublicConfig,
    ensIndexer: serializedEnsIndexerPublicConfig,
    ensRainbow: serializedEnsRainbowPublicConfig,
  };
}
