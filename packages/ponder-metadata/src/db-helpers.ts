import { pgSchema, pgTable } from "drizzle-orm/pg-core";
import { type ReadonlyDrizzle, eq } from "ponder";

/**
 * Internal ponder metadata type.
 * Copied from https://github.com/ponder-sh/ponder/blob/32634897bf65e92a85dc4cccdaba70c9425d90f3/packages/core/src/database/index.ts#L94-L102
 */
type PonderAppMeta = {
  is_locked: 0 | 1;
  is_dev: 0 | 1;
  heartbeat_at: number;
  build_id: string;
  checkpoint: string;
  table_names: Array<string>;
  version: string;
};

/**
 * Get DB schema for _ponder_meta table.
 * Akin to https://github.com/ponder-sh/ponder/blob/32634897bf65e92a85dc4cccdaba70c9425d90f3/packages/core/src/database/index.ts#L129-L141
 *
 * @param databaseNamespace A namespace for the database.
 * @returns A table schema for _ponder_meta table.
 * */
const getPonderMetaTableSchema = (databaseNamespace: string) => {
  if (databaseNamespace === "public") {
    return pgTable("_ponder_meta", (t) => ({
      key: t.text().primaryKey().$type<"app">(),
      value: t.jsonb().$type<PonderAppMeta>().notNull(),
    }));
  }

  return pgSchema(databaseNamespace).table("_ponder_meta", (t) => ({
    key: t.text().primaryKey().$type<"app">(),
    value: t.jsonb().$type<PonderAppMeta>().notNull(),
  }));
};

/**
 * Get DB schema for _ponder_status table.
 * Akin to https://github.com/ponder-sh/ponder/blob/32634897bf65e92a85dc4cccdaba70c9425d90f3/packages/core/src/database/index.ts#L143-L159
 *
 * @param databaseNamespace A namespace for the database.
 * @returns A table schema for _ponder_status table.
 */
const getPonderStatusTableSchema = (databaseNamespace: string) => {
  if (databaseNamespace === "public") {
    return pgTable("_ponder_status", (t) => ({
      network_name: t.text().primaryKey(),
      block_number: t.bigint({ mode: "number" }),
      block_timestamp: t.bigint({ mode: "number" }),
      ready: t.boolean().notNull(),
    }));
  }

  return pgSchema(databaseNamespace).table("_ponder_status", (t) => ({
    network_name: t.text().primaryKey(),
    block_number: t.bigint({ mode: "number" }),
    block_timestamp: t.bigint({ mode: "number" }),
    ready: t.boolean().notNull(),
  }));
};

type PonderStatusTableSchema = ReturnType<typeof getPonderStatusTableSchema>;

/**
 * Get a list of ponder status entries for each network.
 *
 * @param namespace A namespace for the database (e.g. "public").
 * @param db Drizzle DB Client instance.
 * @returns a list of ponder status entries for each network.
 */
export async function queryPonderStatus(
  namespace: string,
  db: ReadonlyDrizzle<Record<string, unknown>>,
): Promise<Array<PonderStatusTableSchema["$inferSelect"]>> {
  const PONDER_STATUS = getPonderStatusTableSchema(namespace);

  return db.select().from(PONDER_STATUS);
}

type PonderMetaTableSchema = ReturnType<typeof getPonderMetaTableSchema>;

/**
 * Get ponder metadata for the app.
 *
 * @param namespace A namespace for the database (e.g. "public").
 * @param db Drizzle DB Client instance.
 * @returns ponder metadata for the app.
 * @throws Error if ponder metadata not found.
 */
export async function queryPonderMeta(
  namespace: string,
  db: ReadonlyDrizzle<Record<string, unknown>>,
): Promise<PonderMetaTableSchema["$inferSelect"]["value"]> {
  const PONDER_META = getPonderMetaTableSchema(namespace);

  const [ponderAppMeta] = await db
    .select({ value: PONDER_META.value })
    .from(PONDER_META)
    .where(eq(PONDER_META.key, "app"))
    .limit(1);

  if (!ponderAppMeta) {
    throw new Error("Ponder metadata not found");
  }

  return ponderAppMeta.value;
}
