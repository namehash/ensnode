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
  table_names: Array<string>;
  version: string;
  is_ready: 0 | 1;
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
