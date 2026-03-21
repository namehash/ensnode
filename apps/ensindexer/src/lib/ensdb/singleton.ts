import config from "@/config";

import { EnsDbWriter } from "@ensnode/ensdb-sdk";

const { databaseUrl: ensDbConnectionString, databaseSchemaName: ensIndexerSchemaName } = config;

/**
 * Singleton instance of ENSDbWriter for the ENSIndexer application.
 */
export const ensDbClient = new EnsDbWriter(ensDbConnectionString, ensIndexerSchemaName);
