// This file was copied 1-to-1 from ENSApi.
// TODO: deduplicate with apps/ensapi/src/lib/handlers/drizzle.ts when ensnode nodejs internal package is created

import { setDatabaseSchema } from "@ponder/client";
import { drizzle } from "drizzle-orm/node-postgres";

type Schema = { [name: string]: unknown };

/**
 * Makes a Drizzle DB object.
 */
export const makeDrizzle = <SCHEMA extends Schema>({
  schema,
  databaseUrl,
  databaseSchema,
}: {
  schema: SCHEMA;
  databaseUrl: string;
  databaseSchema: string;
}) => {
  // monkeypatch schema onto tables
  setDatabaseSchema(schema, databaseSchema);

  return drizzle(databaseUrl, { schema, casing: "snake_case" });
};
