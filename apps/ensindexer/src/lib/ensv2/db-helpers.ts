import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

export async function ensureAccount(context: Context, address: Address) {
  await context.db.insert(schema.account).values({ address }).onConflictDoNothing();
}
