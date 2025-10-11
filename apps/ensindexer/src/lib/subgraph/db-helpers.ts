import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { makeEventId } from "@/lib/subgraph/ids";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(schema.subgraph_account).values({ id: address }).onConflictDoNothing();
}

export async function upsertDomain(
  context: Context,
  values: typeof schema.subgraph_domain.$inferInsert,
) {
  // remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db.insert(schema.subgraph_domain).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.subgraph_resolver.$inferInsert,
) {
  // remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db.insert(schema.subgraph_resolver).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.subgraph_registration.$inferInsert,
) {
  // remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db
    .insert(schema.subgraph_registration)
    .values(values)
    .onConflictDoUpdate(otherValues);
}

// simplifies generating the shared event column values from the ponder Event object
export function sharedEventValues(chainId: number, event: Omit<Event, "args">) {
  return {
    id: makeEventId(chainId, event.block.number, event.log.logIndex),
    blockNumber: event.block.number,
    transactionID: event.transaction.hash,
  };
}
