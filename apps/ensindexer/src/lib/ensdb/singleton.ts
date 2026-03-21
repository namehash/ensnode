import config from "@/config";

import {
  buildEnsDbDrizzleClient,
  buildEnsDbSchema,
  buildIndividualEnsDbSchemas,
  EnsDbWriter,
} from "@ensnode/ensdb-sdk";

const { databaseUrl: ensDbConnectionString, databaseSchemaName: ensIndexerSchemaName } = config;

const { ensIndexerSchema, ensNodeSchema } = buildIndividualEnsDbSchemas(ensIndexerSchemaName);
/**
 * Build a ENSDb Schema for Drizzle client using the ENSIndexer Schema name from config.
 */
const ensDbSchema = buildEnsDbSchema(ensIndexerSchema);
const ensDbDrizzleClient = buildEnsDbDrizzleClient(ensDbConnectionString, ensDbSchema);

/**
 * Singleton instance of ENSDbWriter for the ENSIndexer application.
 */
export const ensDbClient = new EnsDbWriter(
  ensDbDrizzleClient,
  ensIndexerSchema,
  ensIndexerSchemaName,
  ensNodeSchema,
);
