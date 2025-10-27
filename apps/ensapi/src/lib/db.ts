import config from "@/config";
import { makeDrizzle } from "@/lib/handlers/drizzle";
import * as schema from "@ensnode/ensnode-schema";

export const db = makeDrizzle({
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchemaName,
  schema,
});
