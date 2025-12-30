import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import type { AccountId, DomainId } from "@ensnode/ensnode-sdk";

/**
 * Ensures that the Domain-Resolver Relationship for the provided `domainId` in `registry` is set
 * to `resolver`. If `resolver` is zeroAddress, it is interpreted as a deletion, and the relationship
 * is removed.
 */
export async function ensureDomainResolverRelation(
  context: Context,
  registry: AccountId,
  domainId: DomainId,
  resolver: Address,
) {
  if (isAddressEqual(zeroAddress, resolver)) {
    await context.db.delete(schema.domainResolverRelation, { ...registry, domainId });
  } else {
    await context.db
      .insert(schema.domainResolverRelation)
      .values({ ...registry, domainId, resolver })
      .onConflictDoUpdate({ resolver });
  }
}
