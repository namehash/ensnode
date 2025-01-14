import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

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

/**
 * Ensure that some domain entity value (not necessarily the provided value) for the requested node exists in
 * the database. It inserts the provided domain entity if it does not exist.
 * Otherwise, just returns the existing domain entity from the db.
 *
 * @param context ponder context to interact with database
 * @param values domain properties, where `id` is the node value
 * @returns domain database entity
 */
export async function ensureDomainExists(
  context: Context,
  values: typeof schema.domain.$inferInsert,
): Promise<typeof schema.domain.$inferSelect> {
  // `onConflictDoUpdate({}}` makes no change to the existing entity
  // (the delta is an empty object, which means no updates to apply)
  // and it always returns the existing entity
  return context.db.insert(schema.domain).values(values).onConflictDoUpdate({});
}
