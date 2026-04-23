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
  return {
    ensIndexer: buildUnvalidatedEnsIndexerPublicConfig(serializedStackInfo.ensIndexer),
    ensRainbow: serializedStackInfo.ensRainbow, // ENSRainbow Public Config is already in a serialized form, so we can include it directly
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
