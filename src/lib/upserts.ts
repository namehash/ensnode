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
 * Idempotent handler to ensure a domain entity for requested node exists in
 * the database. It inserts a domain entity if it does not exist. Otherwise,
 * just returns the existing domain entity from the db.
 *
 * @param context ponder context object
 * @param values domain properties
 * @returns domain database entity
 */
export async function ensureDomainExists(
  context: Context,
  values: typeof schema.domain.$inferInsert,
): Promise<typeof schema.domain.$inferSelect> {
  const domainEntity = await context.db.insert(schema.domain).values(values).onConflictDoNothing();

  if (!domainEntity) {
    throw new Error("domain expected");
  }

  return domainEntity;
}
