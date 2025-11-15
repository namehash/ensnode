import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import type { AccountId, DomainId, ResolverId } from "@ensnode/ensnode-sdk";

export async function removedomainResolverRelation(
  context: Context,
  registry: AccountId,
  domainId: DomainId,
) {
  await context.db.delete(schema.domainResolverRelation, { ...registry, domainId });
}

export async function upsertdomainResolverRelation(
  context: Context,
  registry: AccountId,
  domainId: DomainId,
  resolverId: ResolverId,
) {
  await context.db
    .insert(schema.domainResolverRelation)
    .values({ ...registry, domainId, resolverId })
    .onConflictDoUpdate({ resolverId });
}
