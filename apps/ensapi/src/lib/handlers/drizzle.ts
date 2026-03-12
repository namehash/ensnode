import { setDatabaseSchema } from "@ponder/client";
import { drizzle } from "drizzle-orm/node-postgres";
import { parseIntoClientConfig } from "pg-connection-string";

import { makeLogger } from "@/lib/logger";

type Schema = { [name: string]: unknown };

const logger = makeLogger("drizzle");

/**
 * Makes a read-only Drizzle DB object.
 */
export const makeReadOnlyDrizzle = <SCHEMA extends Schema>({
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

  return drizzle({
    connection: {
      ...parseIntoClientConfig(databaseUrl),
      options: "-c default_transaction_read_only=on",
    },
    schema,
    casing: "snake_case",
    logger: {
      logQuery: (query, params) => logger.trace({ params }, query),
    },
  });
};
