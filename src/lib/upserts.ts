import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

export async function upsertAccount(context: Context, address: Address) {
  return await context.db.insert(schema.account).values({ id: address }).onConflictDoNothing();
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.resolver.$inferInsert,
) {
  return await context.db.insert(schema.resolver).values(values).onConflictDoUpdate(values);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.registration.$inferInsert,
) {
  return await context.db.insert(schema.registration).values(values).onConflictDoUpdate(values);
}
