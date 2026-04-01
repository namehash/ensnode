import type { Address } from "viem";

import { type ENSv1DomainId, interpretAddress } from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Sets an ENSv1 Domain's effective owner to `owner`.
 */
export async function materializeENSv1DomainEffectiveOwner(
  context: IndexingEngineContext,
  id: ENSv1DomainId,
  owner: Address,
) {
  // ensure owner
  await ensureAccount(context, owner);

  // update v1Domain's effective owner
  await context.ensDb
    .update(ensIndexerSchema.v1Domain, { id })
    .set({ ownerId: interpretAddress(owner) });
}
