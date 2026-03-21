import { EnsDbReader } from "@ensnode/ensdb-sdk";

import ensDbConfig from "@/config/ensdb-config";

const { databaseUrl: ensDbConnectionString, databaseSchemaName: ensIndexerSchemaName } =
  ensDbConfig;

/**
 * Singleton instance of ENSDbReader for the ENSApi application.
 */
export const ensDbClient = new EnsDbReader(ensDbConnectionString, ensIndexerSchemaName);
