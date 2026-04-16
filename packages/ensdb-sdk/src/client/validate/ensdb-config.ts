import { prettifyError } from "zod/v4";

import type { Unvalidated } from "@ensnode/ensnode-sdk";

import type { EnsDbConfig } from "../ensdb-config";
import { EnsDbConfigSchema } from "../zod-schemas/ensdb-config";

/**
 * Validate ENSDb config
 *
 * @param unvalidatedConfig - Unvalidated ENSDb config
 * @returns Valid ENSDb config
 * @throws Error if validation fails, with details about the validation errors
 */
export function validateEnsDbConfig(unvalidatedConfig: Unvalidated<EnsDbConfig>): EnsDbConfig {
  const ensDbConfig = EnsDbConfigSchema.safeParse(unvalidatedConfig);

  if (!ensDbConfig.success) {
    throw new Error(`Failed to parse ENSDb configuration: \n${prettifyError(ensDbConfig.error)}\n`);
  }

  return ensDbConfig.data;
}
