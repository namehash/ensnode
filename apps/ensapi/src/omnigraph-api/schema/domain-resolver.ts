import { builder } from "@/omnigraph-api/builder";
import {
  getDomainAssignedResolver,
  getDomainEffectiveResolver,
} from "@/omnigraph-api/lib/get-domain-resolver";
import { isUnindexedDomain } from "@/omnigraph-api/lib/unindexed-domain";
import type { Domain } from "@/omnigraph-api/schema/domain";
import { ResolverRef } from "@/omnigraph-api/schema/resolver";

////////////////////////////////
// DomainResolver
////////////////////////////////
export const DomainResolverRef = builder.objectRef<Domain>("DomainResolver");

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
      // a virtual UnindexedDomain has no Resolver assigned directly to it
      resolve: (domain) =>
        isUnindexedDomain(domain) ? null : getDomainAssignedResolver(domain.id),
    }),

    ////////////////////////////
    // DomainResolver.effective
    ////////////////////////////
    effective: t.field({
      description:
        "The Resolver that ENS Forward Resolution (ENSIP-10) lands on for this Domain — i.e. its _effective_ Resolver. Null when no active Resolver exists or the Domain is not in the Canonical Nametree.",
      type: ResolverRef,
      nullable: true,
      // an UnindexedDomain is resolvable precisely because an ancestor bears a wildcard Resolver;
      // that ancestor Resolver (identified by the namegraph walk that minted it) is its effective one
      resolve: (domain) =>
        isUnindexedDomain(domain)
          ? domain.effectiveResolverId
          : getDomainEffectiveResolver(domain.id),
    }),
  }),
});
