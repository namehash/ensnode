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
  databaseSchema?: string;
}) => {
  // monkeypatch schema onto tables if databaseSchema is provided
  if (databaseSchema) {
    setDatabaseSchema(schema, databaseSchema);
  }

  const parsedConfig = parseIntoClientConfig(databaseUrl);
  const existingOptions = parsedConfig.options || "";
  const readOnlyOption = "-c default_transaction_read_only=on";

  return drizzle({
    connection: {
      ...parsedConfig,
      // Combine existing options from URL with read-only requirement
      options: existingOptions ? `${existingOptions} ${readOnlyOption}` : readOnlyOption,
    },
    schema,
    casing: "snake_case",
    logger: {
      logQuery: (query, params) => logger.trace({ params }, query),
    },
  });
};
