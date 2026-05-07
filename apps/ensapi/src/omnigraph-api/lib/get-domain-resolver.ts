import type { DomainId } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

export async function getDomainResolver(domainId: DomainId) {
  const drr = await ensDb.query.domainResolverRelation.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    with: { resolver: true },
  });

  return drr?.resolver;
}
