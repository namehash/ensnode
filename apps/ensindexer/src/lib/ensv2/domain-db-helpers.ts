import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { type ENSv1DomainId, interpretAddress } from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";

/**
 * Sets an ENSv1 Domain's effective owner to `owner`.
 */
export async function materializeENSv1DomainEffectiveOwner(
  context: Context,
  id: ENSv1DomainId,
  owner: Address,
) {
  // ensure owner
  await ensureAccount(context, owner);

  // update v1Domain's effective owner
  await context.db.update(schema.v1Domain, { id }).set({ ownerId: interpretAddress(owner) });
}
