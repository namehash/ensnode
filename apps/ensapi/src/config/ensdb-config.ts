import { type EnsDbConfig, validateEnsDbConfig } from "@ensnode/ensdb-sdk";
import type { Unvalidated } from "@ensnode/ensnode-sdk";
import type { EnsDbEnvironment } from "@ensnode/ensnode-sdk/internal";

import logger from "@/lib/logger";

/**
 * Build ENSDb config from environment variables for ENSApi app.
 *
 * Exits the process if the configuration is invalid, logging the error details.
 */
export function buildEnsDbConfigFromEnvironment(env: EnsDbEnvironment): EnsDbConfig {
  const unvalidatedConfig = {
    ensDbUrl: env.ENSDB_URL,
    ensIndexerSchemaName: env.ENSINDEXER_SCHEMA_NAME,
  } satisfies Unvalidated<EnsDbConfig>;

  try {
    return validateEnsDbConfig(unvalidatedConfig);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to validate ENSDb config from environment: ${errorMessage}`);
    process.exit(1);
  }
}
