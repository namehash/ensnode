import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { EnsIndexerStackInfo } from "../ensindexer-stack-info";
import { makeEnsIndexerStackInfoSchema } from "../zod-schemas/ensindexer-stack-info";

/**
 * Validate a maybe {@link EnsIndexerStackInfo} object.
 */
export function validateEnsIndexerStackInfo(
  maybeStackInfo: Unvalidated<EnsIndexerStackInfo>,
  valueLabel?: string,
): EnsIndexerStackInfo {
  const parsed = makeEnsIndexerStackInfoSchema(valueLabel).safeParse(maybeStackInfo);

  if (parsed.error) {
    throw new Error(`Cannot validate EnsIndexerStackInfo:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
