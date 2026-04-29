import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { EnsNodeStackInfo } from "../ensnode-stack-info";
import { makeEnsNodeStackInfoSchema } from "../zod-schemas/ensnode-stack-info";

/**
 * Validate a maybe {@link EnsNodeStackInfo} object.
 */
export function validateEnsNodeStackInfo(
  maybeStackInfo: Unvalidated<EnsNodeStackInfo>,
  valueLabel?: string,
): EnsNodeStackInfo {
  const parsed = makeEnsNodeStackInfoSchema(valueLabel).safeParse(maybeStackInfo);

  if (parsed.error) {
    throw new Error(`Cannot validate EnsNodeStackInfo:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
