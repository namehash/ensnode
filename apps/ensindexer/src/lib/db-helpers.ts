import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { makeEventId } from "@/lib/ids";

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
