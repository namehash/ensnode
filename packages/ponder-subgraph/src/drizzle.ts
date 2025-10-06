import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";

export type Drizzle<TSchema extends Schema = { [name: string]: never }> =
  | NodePgDatabase<TSchema>
  | PgliteDatabase<TSchema>;

export type Schema = { [name: string]: unknown };

export const makeDb = <SCHEMA extends Schema>(schema: SCHEMA) =>
  drizzle(process.env.DATABASE_URL, { schema, casing: "snake_case" });
