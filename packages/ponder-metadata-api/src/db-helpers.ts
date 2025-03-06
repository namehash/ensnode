import { pgSchema, pgTable } from "drizzle-orm/pg-core";
import { type ReadonlyDrizzle, eq } from "ponder";

type NamespaceBuild = string;

type PonderApp = {
  is_locked: 0 | 1;
  is_dev: 0 | 1;
  heartbeat_at: number;
  build_id: string;
  checkpoint: string;
  table_names: string[];
  version: string;
};

const getPonderMeta = (namespace: NamespaceBuild) => {
  if (namespace === "public") {
    return pgTable("_ponder_meta", (t) => ({
      key: t.text().primaryKey().$type<"app">(),
      value: t.jsonb().$type<PonderApp>().notNull(),
    }));
  }

  return pgSchema(namespace).table("_ponder_meta", (t) => ({
    key: t.text().primaryKey().$type<"app">(),
    value: t.jsonb().$type<PonderApp>().notNull(),
  }));
};

type PonderStatus = {
  network_name: string;
  block_number: number;
  block_timestamp: number;
  ready: boolean;
};

const getPonderStatus = (namespace: NamespaceBuild) => {
  if (namespace === "public") {
    return pgTable("_ponder_status", (t) => ({
      network_name: t.text().primaryKey(),
      block_number: t.bigint({ mode: "number" }),
      block_timestamp: t.bigint({ mode: "number" }),
      ready: t.boolean().notNull(),
    }));
  }

  return pgSchema(namespace).table("_ponder_status", (t) => ({
    network_name: t.text().primaryKey(),
    block_number: t.bigint({ mode: "number" }),
    block_timestamp: t.bigint({ mode: "number" }),
    ready: t.boolean().notNull(),
  }));
};

export async function queryPonderStatus(
  namespace: string,
  db: ReadonlyDrizzle<Record<string, unknown>>,
) {
  const PONDER_STATUS = getPonderStatus(namespace);

  return db.select().from(PONDER_STATUS) as unknown as Array<typeof PONDER_STATUS.$inferSelect>;
}

export async function queryPonderMeta(
  namespace: string,
  db: ReadonlyDrizzle<Record<string, unknown>>,
) {
  const PONDER_META = getPonderMeta(namespace);

  return db
    .select({ value: PONDER_META.value })
    .from(PONDER_META)
    .where(eq(PONDER_META.key, "app"))
    .limit(1)
    .then((result: any) => result[0]?.value) as unknown as typeof PONDER_META.$inferSelect.value;
}
