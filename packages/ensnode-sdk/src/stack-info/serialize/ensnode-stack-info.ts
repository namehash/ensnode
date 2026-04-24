import { serializeEnsApiPublicConfig } from "../../ensapi/config/serialize";
import type { SerializedEnsApiPublicConfig } from "../../ensapi/config/serialized-types";
import type { EnsNodeStackInfo } from "../ensnode-stack-info";
import {
  type SerializedEnsIndexerStackInfo,
  serializeEnsIndexerStackInfo,
} from "./ensindexer-stack-info";

/**
 * Serialized representation of {@link EnsNodeStackInfo}.
 */
export interface SerializedEnsNodeStackInfo extends SerializedEnsIndexerStackInfo {
  ensApi: SerializedEnsApiPublicConfig;
}

/**
 * Serialize a {@link EnsNodeStackInfo} object.
 */
export function serializeEnsNodeStackInfo(stackInfo: EnsNodeStackInfo): SerializedEnsNodeStackInfo {
  return {
    ...serializeEnsIndexerStackInfo(stackInfo),
    ensApi: serializeEnsApiPublicConfig(stackInfo.ensApi),
  };
}
