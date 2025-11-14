import {
  type DomainId,
  type ENSv1DomainId,
  makeResolverId,
  type ResolverId,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

export async function getDomainResolver(domainId: DomainId): Promise<ResolverId | undefined> {
  // TODO: refactor nodeResolverRelation to be domainResolverRelation using DomainId
  const nrr = await db.query.nodeResolverRelation.findFirst({
    where: (t, { eq }) => eq(t.node, domainId as ENSv1DomainId),
  });

  if (!nrr) return undefined;

  return makeResolverId({ chainId: nrr.chainId, address: nrr.resolver });
}
