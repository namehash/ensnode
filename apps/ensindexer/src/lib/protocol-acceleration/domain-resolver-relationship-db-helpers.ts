import type { AccountId, Address, DomainId } from "enssdk";
import { isAddressEqual, zeroAddress } from "viem";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import { upsertResolver } from "@/lib/protocol-acceleration/resolver-db-helpers";

/**
 * Ensures that the Domain-Resolver Relationship for the provided `domainId` in `registry` is set
 * to `resolver`. If `resolver` is zeroAddress, it is interpreted as a deletion, and the relationship
 * is removed.
 */
export async function ensureDomainResolverRelation(
  context: IndexingEngineContext,
  registry: AccountId,
  domainId: DomainId,
  resolver: Address,
) {
  if (isAddressEqual(zeroAddress, resolver)) {
    await context.ensDb.delete(ensIndexerSchema.domainResolverRelation, { ...registry, domainId });
  } else {
    // ensures a resolver entity exists for all observed Resolver contracts
    await upsertResolver(context, { chainId: registry.chainId, address: resolver });

    await context.ensDb
      .insert(ensIndexerSchema.domainResolverRelation)
      .values({ ...registry, domainId, resolver })
      .onConflictDoUpdate({ resolver });
  }
}
