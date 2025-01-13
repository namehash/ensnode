import type { Context } from "ponder:registry";
import { accounts, registrations, resolvers } from "ponder:schema";
import type { Address } from "viem";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(accounts).values({ id: address }).onConflictDoNothing();
}

export async function upsertResolver(context: Context, values: typeof resolvers.$inferInsert) {
  return context.db.insert(resolvers).values(values).onConflictDoUpdate(values);
}

export async function upsertRegistration(
  context: Context,
  values: typeof registrations.$inferInsert,
) {
  return context.db.insert(registrations).values(values).onConflictDoUpdate(values);
}
