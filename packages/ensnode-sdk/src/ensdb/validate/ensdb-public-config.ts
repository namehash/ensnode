import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { EnsDbPublicConfig } from "../ensdb-public-config";
import { schemaEnsDbPublicConfig } from "../zod-schemas/ensdb-public-config";

/**
 * Validate ENSDb Public Config.
 *
 * @param unvalidatedConfig The unvalidated ENSDb Public Config to validate.
 * @returns The validated ENSDb Public Config.
 * @throws Error if the provided config is invalid, with details on validation errors.
 */
export function validateEnsDbPublicConfig(
  unvalidatedConfig: Unvalidated<EnsDbPublicConfig>,
): EnsDbPublicConfig {
  const validationResult = schemaEnsDbPublicConfig.safeParse(unvalidatedConfig);

  if (!validationResult.success) {
    throw new Error(`Invalid ENSDb Public Config: \n${prettifyError(validationResult.error)}\n`);
  }

  return validationResult.data;
}
