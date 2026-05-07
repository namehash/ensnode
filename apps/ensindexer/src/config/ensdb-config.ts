import { type EnsDbConfig, validateEnsDbConfig } from "@ensnode/ensdb-sdk";
import type { Unvalidated } from "@ensnode/ensnode-sdk";

/**
 * Build ENSDb config from environment variables for ENSIndexer app.
 *
 * Exits the process if the configuration is invalid, logging the error details.
 */
function buildEnsDbConfigFromEnvironment(env: NodeJS.ProcessEnv): EnsDbConfig {
  const unvalidatedConfig = {
    ensDbUrl: env.ENSDB_URL,
    ensIndexerSchemaName: env.ENSINDEXER_SCHEMA_NAME,
  } satisfies Unvalidated<EnsDbConfig>;

  try {
    return validateEnsDbConfig(unvalidatedConfig);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to validate ENSDb config from environment: ${errorMessage}`);
    process.exit(1);
  }
}

export default buildEnsDbConfigFromEnvironment(process.env);
