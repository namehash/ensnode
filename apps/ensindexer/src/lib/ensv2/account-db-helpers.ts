import type { Address, NormalizedAddress } from "enssdk";

import { interpretAddress } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Ensures that the account identified by `address` exists.
 * If `address` is the zeroAddress, no-op.
 */
export async function ensureAccount(
  context: IndexingEngineContext,
  address: Address,
): Promise<NormalizedAddress | null> {
  const id = interpretAddress(address);
  if (id === null) return null;

  await context.ensDb.insert(ensIndexerSchema.account).values({ id: id }).onConflictDoNothing();

  return id;
}
