import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { makeEventId } from "@/lib/ids";
import { PluginName } from "@ensnode/utils";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(schema.account).values({ id: address }).onConflictDoNothing();
}

export async function upsertDomain(context: Context, values: typeof schema.domain.$inferInsert) {
  return context.db.insert(schema.domain).values(values).onConflictDoUpdate(values);
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

// simplifies generating the shared event column values from the ponder Event object
export function makeSharedEventValues(pluginName: PluginName) {
  return function sharedEventValues(chainId: number, event: Omit<Event, "args">) {
    return {
      id: makeEventId(pluginName, chainId, event.block.number, event.log.logIndex),
      blockNumber: event.block.number,
      transactionID: event.transaction.hash,
    };
  };
}
