import { type EnsDbConfig, validateEnsDbConfig } from "@ensnode/ensdb-sdk";
import type { Unvalidated } from "@ensnode/ensnode-sdk";

import { lazyProxy } from "@/lib/lazy";
import logger from "@/lib/logger";

/**
 * Build ENSDb config from environment variables for ENSApi app.
 *
 * Exits the process if the configuration is invalid, logging the error details.
 */
export function buildEnsDbConfigFromEnvironment(env: NodeJS.ProcessEnv): EnsDbConfig {
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

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
const ensDbConfig = lazyProxy<EnsDbConfig>(() => buildEnsDbConfigFromEnvironment(process.env));

export default ensDbConfig;
