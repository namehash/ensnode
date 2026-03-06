import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { EnsApiPublicConfig } from "../types";
import { makeEnsApiPublicConfigSchema } from "../zod-schemas";

/**
 * Validates an unvalidated representation of
 * {@link EnsApiPublicConfig} object.
 *
 * @throws Error if the provided object is not
 *         a valid {@link EnsApiPublicConfig}.
 */
export function validateEnsApiPublicConfig(
  unvalidatedConfig: Unvalidated<EnsApiPublicConfig>,
): EnsApiPublicConfig {
  const schema = makeEnsApiPublicConfigSchema();
  const result = schema.safeParse(unvalidatedConfig);

  if (!result.success) {
    throw new Error(`Invalid EnsApiPublicConfig: ${prettifyError(result.error)}`);
  }

  return result.data;
}
