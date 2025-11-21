import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import { type AccountId, type DomainId, makeResolverId } from "@ensnode/ensnode-sdk";

export async function ensureDomainResolverRelation(
  context: Context,
  registry: AccountId,
  domainId: DomainId,
  resolver: Address,
) {
  const isZeroResolver = isAddressEqual(zeroAddress, resolver);
  if (isZeroResolver) {
    await context.db.delete(schema.domainResolverRelation, { ...registry, domainId });
  } else {
    const resolverId = makeResolverId({ chainId: registry.chainId, address: resolver });
    await context.db
      .insert(schema.domainResolverRelation)
      .values({ ...registry, domainId, resolverId })
      .onConflictDoUpdate({ resolverId });
  }
}
