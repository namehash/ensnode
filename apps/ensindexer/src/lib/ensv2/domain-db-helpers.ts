import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import type { DomainId } from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";

/**
 * Sets `domainId`'s owner to `owner` if exists.
 */
export async function materializeDomainOwner(context: Context, domainId: DomainId, owner: Address) {
  const domain = await context.db.find(schema.domain, { id: domainId });
  if (domain) {
    await ensureAccount(context, owner);
    await context.db.update(schema.domain, { id: domainId }).set({ ownerId: owner });
  }
}
