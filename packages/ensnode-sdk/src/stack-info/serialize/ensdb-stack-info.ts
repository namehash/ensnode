import type { SerializedEnsDbPublicConfig } from "../../ensdb/serialize/config";
import type { EnsDbStackInfo } from "../ensdb-stack-info";
import {
  type SerializedEnsIndexerStackInfo,
  serializeEnsIndexerStackInfo,
} from "./ensindexer-stack-info";

/**
 * Serialized representation of {@link EnsDbStackInfo}.
 */
export interface SerializedEnsDbStackInfo extends SerializedEnsIndexerStackInfo {
  ensDb: SerializedEnsDbPublicConfig;
}

/**
 * Serialize a {@link EnsDbStackInfo} object.
 */
export function serializeEnsDbStackInfo(stackInfo: EnsDbStackInfo): SerializedEnsDbStackInfo {
  return {
    ...serializeEnsIndexerStackInfo(stackInfo),
    ensDb: stackInfo.ensDb, // ENSDb Public Config is already in a serialized form, so we can include it directly
  };
}
