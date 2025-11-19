import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import type { ENSv1DomainId } from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";

/**
 * Sets an ENSv1 Domain's owner to `owner` if exists.
 */
export async function materializeENSv1DomainOwner(
  context: Context,
  id: ENSv1DomainId,
  owner: Address,
) {
  const domain = await context.db.find(schema.v1Domain, { id });
  // TODO: why did i want to put this in a conditional again? why doesn't v1 domain always exist?
  if (domain) {
    await ensureAccount(context, owner);
    await context.db.update(schema.v1Domain, { id }).set({ ownerId: owner });
  }
}
