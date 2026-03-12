// This file is based on `packages/ponder-subgraph/src/drizzle.ts` file.
// We currently duplicate the makeDrizzle function, as we don't have
// a shared package for backend code yet. When we do, we can move
// this function to the shared package and import it in both places.
import { drizzle } from "drizzle-orm/node-postgres";

type Schema = { [name: string]: unknown };

/**
 * Makes a Drizzle DB object.
 */
export const makeDrizzle = <SCHEMA extends Schema>({
  schema,
  databaseUrl,
}: {
  schema: SCHEMA;
  databaseUrl: string;
}) => {
  return drizzle(databaseUrl, { schema, casing: "snake_case" });
};
