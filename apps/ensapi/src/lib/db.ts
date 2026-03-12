import config from "@/config";

import * as schema from "@ensnode/ensnode-schema";

import { makeReadOnlyDrizzle } from "@/lib/handlers/drizzle";

/**
 * Read-only Drizzle instance for ENSDb queries to ENSIndexer Schema
 */
export const db = makeReadOnlyDrizzle({
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchemaName,
  schema,
});
