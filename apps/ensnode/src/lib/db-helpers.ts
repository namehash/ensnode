import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import { pgSchema, pgTable } from "drizzle-orm/pg-core";
import type { Address } from "viem";
import { makeEventId } from "./ids";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(schema.account).values({ id: address }).onConflictDoNothing();
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.resolver.$inferInsert,
) {
  return context.db.insert(schema.resolver).values(values).onConflictDoUpdate(values);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.registration.$inferInsert,
) {
  return context.db.insert(schema.registration).values(values).onConflictDoUpdate(values);
}

// shared event values for all event types
// uses `registrarName` to ensure distinct event ids across separate registrars
export function createSharedEventValues(registrarName: string) {
  // simplifies generating the shared event column values from the ponder Event object
  return function sharedEventValues(event: Omit<Event, "args">) {
    return {
      id: makeEventId(registrarName, event.block.number, event.log.logIndex),
      blockNumber: event.block.number,
      transactionID: event.transaction.hash,
    };
  };
}

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
