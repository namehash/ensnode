import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

export async function upsertAccount(context: Context, address: Address) {
  return await context.db.insert(schema.accounts).values({ id: address }).onConflictDoNothing();
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.resolvers.$inferInsert,
) {
  return await context.db.insert(schema.resolvers).values(values).onConflictDoUpdate(values);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.registrations.$inferInsert,
) {
  return await context.db.insert(schema.registrations).values(values).onConflictDoUpdate(values);
}
