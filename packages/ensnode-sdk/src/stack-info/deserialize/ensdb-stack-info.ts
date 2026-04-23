import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { EnsDbStackInfo } from "../ensdb-stack-info";
import type { SerializedEnsDbStackInfo } from "../serialize/ensdb-stack-info";
import {
  makeEnsDbStackInfoSchema,
  makeSerializedEnsDbStackInfoSchema,
} from "../zod-schemas/ensdb-stack-info";
import { buildUnvalidatedEnsIndexerStackInfo } from "./ensindexer-stack-info";

/**
 * Builds an unvalidated {@link EnsDbStackInfo} object to be
 * validated with {@link makeEnsDbStackInfoSchema}.
 *
 * @param serializedStackInfo - The serialized stack info to build from.
 * @return An unvalidated {@link EnsDbStackInfo} object.
 */
export function buildUnvalidatedEnsDbStackInfo(
  serializedStackInfo: SerializedEnsDbStackInfo,
): Unvalidated<EnsDbStackInfo> {
  const { ensDb, ...serializedEnsindexerStackInfo } = serializedStackInfo;
  return {
    ...buildUnvalidatedEnsIndexerStackInfo(serializedEnsindexerStackInfo),
    ensDb, // ENSDb Public Config is already in a serialized form, so we can include it directly
  };
}

/**
 * Deserialize value into {@link EnsDbStackInfo} object.
 */
export function deserializeEnsDbStackInfo(
  maybeStackInfo: Unvalidated<SerializedEnsDbStackInfo>,
  valueLabel?: string,
): EnsDbStackInfo {
  const parsed = makeSerializedEnsDbStackInfoSchema(valueLabel)
    .transform(buildUnvalidatedEnsDbStackInfo)
    .pipe(makeEnsDbStackInfoSchema(valueLabel))
    .safeParse(maybeStackInfo);

  if (parsed.error) {
    throw new Error(`Cannot deserialize EnsDbStackInfo:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
