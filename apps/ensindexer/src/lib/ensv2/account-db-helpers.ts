import type { Address } from "viem";

import { interpretAddress } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Ensures that the account identified by `address` exists.
 * If `address` is the zeroAddress, no-op.
 */
export async function ensureAccount(context: IndexingEngineContext, address: Address) {
  const interpreted = interpretAddress(address);
  if (interpreted === null) return;

  await context.ensDb
    .insert(ensIndexerSchema.account)
    .values({ id: interpreted })
    .onConflictDoNothing();
}
