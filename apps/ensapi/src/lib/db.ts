import config from "@/config";

import * as ensIndexerSchema from "@ensnode/ensnode-schema/ensindexer";

import { makeReadOnlyDrizzle } from "@/lib/handlers/drizzle";

/**
 * Read-only Drizzle instance for ENSDb queries to ENSIndexer Schema
 */
export const db = makeReadOnlyDrizzle({
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchemaName,
  schema: ensIndexerSchema,
});
