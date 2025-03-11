import * as _schema from "@ensnode/ponder-schema";
import { Table, is } from "drizzle-orm";
// import { setDatabaseSchema } from "@ponder/client";
import { drizzle } from "drizzle-orm/node-postgres";

const setDatabaseSchema = <T extends { [name: string]: unknown }>(
  schema: T,
  schemaName: string,
): T => {
  for (const table of Object.values(schema)) {
    if (is(table, Table)) {
      // Use type assertion to fix the TypeScript error
      (table as any)[Symbol.for("drizzle:Schema")] = schemaName;
    }
  }
  return schema;
};

export const schema = setDatabaseSchema(_schema, Bun.env.DATABASE_SCHEMA || 'public');
export const db = drizzle(Bun.env.DATABASE_URL, { schema, casing: "snake_case" });
