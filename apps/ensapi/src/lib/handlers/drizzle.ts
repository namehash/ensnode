import { Table, isTable } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { isPgEnum } from "drizzle-orm/pg-core";

type Schema = { [name: string]: unknown };

// https://github.com/ponder-sh/ponder/blob/f7f6444ab8d1a870fe6492023941091df7b7cddf/packages/client/src/index.ts#L226C1-L239C3
const setDatabaseSchema = <T extends Schema>(schema: T, schemaName: string) => {
  for (const table of Object.values(schema)) {
    if (isTable(table)) {
      // @ts-ignore
      table[Table.Symbol.Schema] = schemaName;
    } else if (isPgEnum(table)) {
      // @ts-ignore
      table.schema = schemaName;
    }
  }
};

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
