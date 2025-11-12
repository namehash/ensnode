import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type AccountId, makeResolverId, type ResolverId } from "@ensnode/ensnode-sdk";

export async function ensureResolver(context: Context, resolver: AccountId): Promise<ResolverId> {
  const id = makeResolverId(resolver);
  await context.db
    .insert(schema.resolver)
    .values({
      id,
      ...resolver,
    })
    .onConflictDoNothing();
  return id;
}
