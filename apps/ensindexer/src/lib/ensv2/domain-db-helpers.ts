import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import { type ENSv1DomainId, interpretAddress } from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";

/**
 * Sets an ENSv1 Domain's owner to `owner`, ensuring that the `owner` account also exists.
 */
export async function materializeENSv1DomainOwner(
  context: Context,
  id: ENSv1DomainId,
  owner: Address,
) {
  const ownerId = interpretAddress(owner);

  // ensure owner Account if non-zeroAddress
  if (ownerId !== null) await ensureAccount(context, ownerId);

  // update v1Domain's effective owner
  await context.db.update(schema.v1Domain, { id }).set({ ownerId });
}
