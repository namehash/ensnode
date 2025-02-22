import { pgSchema, pgTable } from "drizzle-orm/pg-core";

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

export const getPonderMeta = (namespace: NamespaceBuild) => {
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

export type GetPonderMetaType = ReturnType<typeof getPonderMeta>;

export const getPonderStatus = (namespace: NamespaceBuild) => {
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

export type GetPonderStatusType = ReturnType<typeof getPonderStatus>;
