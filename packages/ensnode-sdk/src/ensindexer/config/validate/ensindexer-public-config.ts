import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { EnsIndexerPublicConfig } from "../types";
import { makeEnsIndexerPublicConfigSchema } from "../zod-schemas";

/**
 * Validates an unvalidated representation of
 * {@link EnsIndexerPublicConfig} object.
 *
 * @throws Error if the provided object is not
 *         a valid {@link EnsIndexerPublicConfig}.
 */
export function validateEnsIndexerPublicConfig(
  unvalidatedConfig: Unvalidated<EnsIndexerPublicConfig>,
): EnsIndexerPublicConfig {
  const schema = makeEnsIndexerPublicConfigSchema();
  const result = schema.safeParse(unvalidatedConfig);

  if (!result.success) {
    throw new Error(`Invalid ENSIndexerPublicConfig: ${prettifyError(result.error)}`);
  }

  return result.data;
}
