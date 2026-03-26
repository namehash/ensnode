import { EnsDbReader } from "@ensnode/ensdb-sdk";

import { buildEnsDbConfigFromEnvironment } from "@/config/ensdb-config.schema";
import { lazyProxy } from "@/lib/lazy";

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).

/**
 * Singleton instance of ENSDbReader for the ENSApi application.
 */
export const ensDbClient = lazyProxy<EnsDbReader>(() => {
  const { ensDbUrl, ensIndexerSchemaName } = buildEnsDbConfigFromEnvironment(process.env);
  return new EnsDbReader(ensDbUrl, ensIndexerSchemaName);
});

/**
 * Convenience alias for {@link ensDbClient.ensDb} to be used for building
 * custom ENSDb queries throughout the ENSApi codebase.
 */
export const ensDb = lazyProxy<EnsDbReader["ensDb"]>(() => ensDbClient.ensDb);

/**
 * Convenience alias for {@link ensDbClient.ensIndexerSchema} to be used for building
 * custom ENSDb queries throughout the ENSApi codebase.
 */
export const ensIndexerSchema = lazyProxy<EnsDbReader["ensIndexerSchema"]>(
  () => ensDbClient.ensIndexerSchema,
);
