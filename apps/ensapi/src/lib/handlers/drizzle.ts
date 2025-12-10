import { setDatabaseSchema } from "@ponder/client";
import type { Logger } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import type pino from "pino";

import { makeLogger } from "@/lib/logger";

type Schema = { [name: string]: unknown };

const logger = makeLogger("drizzle");

class PinoDrizzleLogger implements Logger {
  constructor(private readonly logger: pino.Logger) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger.debug({ params }, query);
  }
}

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
    logger: new PinoDrizzleLogger(logger),
  });
};
