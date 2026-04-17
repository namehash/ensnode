import type { SerializedEnsApiPublicConfig } from "../../ensapi";
import { serializeEnsApiPublicConfig } from "../../ensapi/config/serialize";
import { serializeEnsIndexerPublicConfig } from "../../ensindexer";
import type { SerializedEnsIndexerPublicConfig } from "../../ensindexer/config/serialized-types";
import type { EnsNodeStackInfo } from "../ensnode-stack-info";

/**
 * Serialized representation of {@link EnsNodeStackInfo}.
 */
export interface SerializedEnsNodeStackInfo
  extends Omit<EnsNodeStackInfo, "ensApi" | "ensIndexer"> {
  ensApi: SerializedEnsApiPublicConfig;
  ensIndexer: SerializedEnsIndexerPublicConfig;
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
