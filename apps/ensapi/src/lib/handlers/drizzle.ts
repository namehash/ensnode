import { setDatabaseSchema } from "@ponder/client";
import { drizzle } from "drizzle-orm/node-postgres";

import { makeLogger } from "@/lib/logger";

type Schema = { [name: string]: unknown };

const logger = makeLogger("drizzle");

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

  return drizzle(databaseUrl, {
    schema,
    casing: "snake_case",
    logger: {
      logQuery: (query, params) => logger.trace({ params }, query),
    },
  });
};
