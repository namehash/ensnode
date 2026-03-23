import { EnsDbReader } from "@ensnode/ensdb-sdk";

import ensDbConfig from "@/config/ensdb-config";

const { databaseUrl: ensDbConnectionString, databaseSchemaName: ensIndexerSchemaName } =
  ensDbConfig;

/**
 * Singleton instance of ENSDbReader for the ENSApi application.
 */
export const ensDbClient = new EnsDbReader(ensDbConnectionString, ensIndexerSchemaName);

/**
 * Convenience alias for {@link ensDbClient.drizzle} to be used for building
 * custom ENSDb queries throughout the ENSApi codebase.
 */
export const ensDb = ensDbClient.drizzle;

/**
 * Convenience alias for {@link ensDbClient.ensIndexerSchema} to be used for building
 * custom ENSDb queries throughout the ENSApi codebase.
 */
export const ensIndexerSchema = ensDbClient.ensIndexerSchema;
