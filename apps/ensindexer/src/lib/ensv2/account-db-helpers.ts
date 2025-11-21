import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { interpretAddress } from "@ensnode/ensnode-sdk";

/**
 * Ensures that the account identified by `address` exists.
 * If `address` is the zeroAddress, no-op.
 */
export async function ensureAccount(context: Context, address: Address) {
  const interpreted = interpretAddress(address);
  if (interpreted === null) return;

  await context.db.insert(schema.account).values({ id: interpreted }).onConflictDoNothing();
}
