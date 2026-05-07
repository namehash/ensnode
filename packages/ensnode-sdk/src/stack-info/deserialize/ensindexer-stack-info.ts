import { prettifyError } from "zod/v4";

import { buildUnvalidatedEnsIndexerPublicConfig } from "../../ensindexer/config/deserialize";
import type { Unvalidated } from "../../shared/types";
import type { EnsIndexerStackInfo } from "../ensindexer-stack-info";
import type { SerializedEnsIndexerStackInfo } from "../serialize/ensindexer-stack-info";
import {
  makeEnsIndexerStackInfoSchema,
  makeSerializedEnsIndexerStackInfoSchema,
} from "../zod-schemas/ensindexer-stack-info";

/**
 * Builds an unvalidated {@link EnsIndexerStackInfo} object to be
 * validated with {@link makeEnsIndexerStackInfoSchema}.
 *
 * @param serializedStackInfo - The serialized stack info to build from.
 * @return An unvalidated {@link EnsIndexerStackInfo} object.
 */
export function buildUnvalidatedEnsIndexerStackInfo(
  serializedStackInfo: SerializedEnsIndexerStackInfo,
): Unvalidated<EnsIndexerStackInfo> {
  // `ensDb` and `ensRainbow` are already in a deserialized form, so we can include them directly
  const { ensDb, ensRainbow } = serializedStackInfo;
  const ensIndexer = buildUnvalidatedEnsIndexerPublicConfig(serializedStackInfo.ensIndexer);

  return {
    ensDb,
    ensIndexer,
    ensRainbow,
  };
}

/**
 * Deserialize value into {@link EnsIndexerStackInfo} object.
 */
export function deserializeEnsIndexerStackInfo(
  maybeStackInfo: Unvalidated<SerializedEnsIndexerStackInfo>,
  valueLabel?: string,
): EnsIndexerStackInfo {
  const parsed = makeSerializedEnsIndexerStackInfoSchema(valueLabel)
    .transform(buildUnvalidatedEnsIndexerStackInfo)
    .pipe(makeEnsIndexerStackInfoSchema(valueLabel))
    .safeParse(maybeStackInfo);

  if (parsed.error) {
    throw new Error(`Cannot deserialize EnsIndexerStackInfo:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
