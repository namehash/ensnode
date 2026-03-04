import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { EnsIndexerVersionInfo } from "../types";
import { makeEnsIndexerVersionInfoSchema } from "../zod-schemas";

/**
 * Validates an unvalidated representation of
 * {@link EnsIndexerVersionInfo} object.
 *
 * @throws Error if the provided object is not
 *         a valid {@link EnsIndexerVersionInfo}.
 */
export function validateEnsIndexerVersionInfo(
  unvalidatedVersionInfo: Unvalidated<EnsIndexerVersionInfo>,
): EnsIndexerVersionInfo {
  const schema = makeEnsIndexerVersionInfoSchema();
  const result = schema.safeParse(unvalidatedVersionInfo);

  if (!result.success) {
    throw new Error(`Invalid EnsIndexerVersionInfo: ${prettifyError(result.error)}`);
  }

  return result.data;
}
