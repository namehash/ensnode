import { serializeEnsApiPublicConfig } from "../../ensapi/config/serialize";
import type { SerializedEnsApiPublicConfig } from "../../ensapi/config/serialized-types";
import type { SerializedEnsDbPublicConfig } from "../../ensdb/serialize/config";
import { serializeEnsIndexerPublicConfig } from "../../ensindexer/config/serialize";
import type { SerializedEnsIndexerPublicConfig } from "../../ensindexer/config/serialized-types";
import type { SerializedEnsRainbowPublicConfig } from "../../ensrainbow/serialize/config";
import type { EnsNodeStackInfo } from "../ensnode-stack-info";

/**
 * Serialized representation of {@link EnsNodeStackInfo}.
 */
export interface SerializedEnsNodeStackInfo {
  ensApi: SerializedEnsApiPublicConfig;
  ensDb: SerializedEnsDbPublicConfig;
  ensIndexer: SerializedEnsIndexerPublicConfig;
  ensRainbow?: SerializedEnsRainbowPublicConfig;
}

/**
 * Serialize a {@link EnsNodeStackInfo} object.
 */
export function serializeEnsNodeStackInfo(stackInfo: EnsNodeStackInfo): SerializedEnsNodeStackInfo {
  return {
    ensApi: serializeEnsApiPublicConfig(stackInfo.ensApi),
    ensDb: stackInfo.ensDb,
    ensIndexer: serializeEnsIndexerPublicConfig(stackInfo.ensIndexer),
    ensRainbow: stackInfo.ensRainbow,
  };
}
