import { prettifyError } from "zod/v4";

import { buildUnvalidatedEnsApiPublicConfig } from "../../ensapi/config/deserialize";
import { buildUnvalidatedEnsIndexerPublicConfig } from "../../ensindexer/config/deserialize";
import type { Unvalidated } from "../../shared/types";
import type { EnsNodeStackInfo } from "../ensnode-stack-info";
import type { SerializedEnsNodeStackInfo } from "../serialize/ensnode-stack-info";
import {
  makeEnsNodeStackInfoSchema,
  makeSerializedEnsNodeStackInfoSchema,
} from "../zod-schemas/ensnode-stack-info";

/**
 * Builds an unvalidated {@link EnsNodeStackInfo} object to be
 * validated with {@link makeEnsNodeStackInfoSchema}.
 *
 * @param serializedStackInfo - The serialized stack info to build from.
 * @return An unvalidated {@link EnsNodeStackInfo} object.
 */
export function buildUnvalidatedEnsNodeStackInfo(
  serializedStackInfo: SerializedEnsNodeStackInfo,
): Unvalidated<EnsNodeStackInfo> {
  // Stack info for ENSApi and ENSIndexer requires deserialization,
  // so we handle them separately here before returning
  // the final stack info object. Stack info for ENSDb and ENSRainbow can be
  // passed through directly since they don't require deserialization.
  const { ensApi, ensIndexer, ...rest } = serializedStackInfo;

  return {
    ...rest,
    ensApi: buildUnvalidatedEnsApiPublicConfig(ensApi),
    ensIndexer: buildUnvalidatedEnsIndexerPublicConfig(ensIndexer),
  };
}

/**
 * Deserialize value into {@link EnsNodeStackInfo} object.
 */
export function deserializeEnsNodeStackInfo(
  maybeStackInfo: Unvalidated<SerializedEnsNodeStackInfo>,
  valueLabel?: string,
): EnsNodeStackInfo {
  const parsed = makeSerializedEnsNodeStackInfoSchema(valueLabel)
    .transform(buildUnvalidatedEnsNodeStackInfo)
    .pipe(makeEnsNodeStackInfoSchema(valueLabel))
    .safeParse(maybeStackInfo);

  if (parsed.error) {
    throw new Error(`Cannot deserialize EnsNodeStackInfo:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
