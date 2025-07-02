import type { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { makeEventId } from "@/lib/ids";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(schema.account).values({ id: address }).onConflictDoNothing();
}

export async function upsertDomain(context: Context, values: typeof schema.domain.$inferInsert) {
  // Remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db.insert(schema.domain).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.resolver.$inferInsert,
) {
  // Remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db.insert(schema.resolver).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.registration.$inferInsert,
) {
  // Remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db.insert(schema.registration).values(values).onConflictDoUpdate(otherValues);
}

export async function upsertDomainResolverRelation(
  context: Context,
  values: typeof schema.ext_domainResolverRelation.$inferInsert,
) {
  // Remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.db
    .insert(schema.ext_domainResolverRelation)
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
