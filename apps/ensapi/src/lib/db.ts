import config from "@/config";

import * as schema from "@ensnode/ensnode-schema";

import { makeDrizzle } from "@/lib/handlers/drizzle";

export const db = makeDrizzle({
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchemaName,
  schema,
});
