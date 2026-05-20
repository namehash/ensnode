import type { DomainId } from "enssdk";

import { builder } from "@/omnigraph-api/builder";
import { getDomainResolver } from "@/omnigraph-api/lib/get-domain-resolver";
import { ResolverRef } from "@/omnigraph-api/schema/resolver";

////////////////////////////////
// DomainResolver
////////////////////////////////
export const DomainResolverRef = builder.objectRef<DomainId>("DomainResolver");

DomainResolverRef.implement({
  description: "Metadata describing this Domain's relationship to its Resolver(s).",
  fields: (t) => ({
    ////////////////////////////
    // DomainResolver.assigned
    ////////////////////////////
    assigned: t.field({
      description:
        "The Resolver that this Domain has assigned, if any. NOTE that this is the Domain's _assigned_ Resolver, _not_ its _effective_ Resolver, which can only be determined by following ENS Forward Resolution and ENSIP-10. Do NOT use this Domain-Resolver relationship in isolation to resolve records, that operation is NOT ENS Forward Resolution.",
      type: ResolverRef,
      nullable: true,
      resolve: (domainId) => getDomainResolver(domainId),
    }),
  }),
});
