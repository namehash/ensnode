// This file was copied 1-to-1 from ENSApi.

import { isTable, Table } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { isPgEnum } from "drizzle-orm/pg-core";
import type { Pool } from "pg";

type Schema = { [name: string]: unknown };

// https://github.com/ponder-sh/ponder/blob/f7f6444ab8d1a870fe6492023941091df7b7cddf/packages/client/src/index.ts#L226C1-L239C3
const setDatabaseSchema = <T extends Schema>(schema: T, schemaName: string) => {
  for (const table of Object.values(schema)) {
    if (isTable(table)) {
      // @ts-expect-error
      table[Table.Symbol.Schema] = schemaName;
    } else if (isPgEnum(table)) {
      // @ts-expect-error
      table.schema = schemaName;
    }
  }
};

/**
 * Makes a Drizzle DB object.
 */
export const makeDrizzle = <SCHEMA extends Schema>({
  schema,
  connectionPool,
  databaseSchema,
}: {
  schema: SCHEMA;
  connectionPool: Pool;
  databaseSchema: string;
}): NodePgDatabase<SCHEMA> & {
  $client: Pool;
} => {
  // monkeypatch schema onto tables
  setDatabaseSchema(schema, databaseSchema);

  return drizzle(connectionPool, { schema, casing: "snake_case" });
};
