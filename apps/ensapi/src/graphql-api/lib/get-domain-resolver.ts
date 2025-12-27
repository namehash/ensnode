import type { DomainId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

export async function getDomainResolver(domainId: DomainId) {
  const drr = await db.query.domainResolverRelation.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    with: { resolver: true },
  });

  return drr?.resolver;
}
