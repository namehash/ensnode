import type { DomainId } from "enssdk";

import di from "@/di";

export async function getDomainResolver(domainId: DomainId) {
  const { ensDb } = di.context;
  const drr = await ensDb.query.domainResolverRelation.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    with: { resolver: true },
  });

  return drr?.resolver;
}
