import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { makeEventId } from "@/lib/ids";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(schema.account).values({ id: address }).onConflictDoNothing();
}

export async function upsertDomain(context: Context, values: typeof schema.domain.$inferInsert) {
  // Ponder won't allow calling `onConflictDoUpdate` when the primary key is on the list of fields to be update:Add commentMore actions
  // we extract the `id` record from `values` object, and only use the `otherValues` object for updates.
  const { id, ...otherValues } = values;

  return context.db.insert(schema.domain).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.resolver.$inferInsert,
) {
  // Ponder won't allow calling `onConflictDoUpdate` when the primary key is on the list of fields to be update:
  // we extract the `id` record from `values` object, and only use the `otherValues` object for updates.
  const { id, ...otherValues } = values;

  return context.db.insert(schema.resolver).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.registration.$inferInsert,
) {
  // Ponder won't allow calling `onConflictDoUpdate` when the primary key is on the list of fields to be update:Add commentMore actions
  // we extract the `id` record from `values` object, and only use the `otherValues` object for updates.
  const { id, ...otherValues } = values;

  return context.db.insert(schema.registration).values(values).onConflictDoUpdate(otherValues);
}

// simplifies generating the shared event column values from the ponder Event object
export function sharedEventValues(chainId: number, event: Omit<Event, "args">) {
  return {
    id: makeEventId(chainId, event.block.number, event.log.logIndex),
    blockNumber: event.block.number,
    transactionID: event.transaction.hash,
  };
}
