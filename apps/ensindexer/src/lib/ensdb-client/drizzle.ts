// This file is based on `packages/ponder-subgraph/src/drizzle.ts` file.
// We currently duplicate the makeDrizzle function, as we don't have
// a shared package for backend code yet. When we do, we can move
// this function to the shared package and import it in both places.
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
