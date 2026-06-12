import { makeResolverId } from "enssdk";

import { resolveReverse } from "@/lib/resolution/reverse-resolution";
import { builder } from "@/omnigraph-api/builder";
import type { NameReferenceModel } from "@/omnigraph-api/lib/find-name-references/find-name-references-resolver";
import { DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import { ResolverRef } from "@/omnigraph-api/schema/resolver";

export const NameReferenceRef = builder.objectRef<NameReferenceModel>("NameReference");

/////////////////
// NameReference
/////////////////
NameReferenceRef.implement({
  description:
    "A Name whose indexed `addr()` record points at an Account, surfaced by `Account.nameReferences`. Reflects literally-indexed records only: no Forward Resolution / CCIP-Read and no ENSIP-19 address record defaulting.",
  fields: (t) => ({
    ////////////////////////
    // NameReference.domain
    ////////////////////////
    domain: t.field({
      description: "The canonical Domain whose `addr(coinType)` record points at this Account.",
      type: DomainInterfaceRef,
      nullable: false,
      resolve: (parent) => parent.domainId,
    }),

    //////////////////////////
    // NameReference.coinType
    //////////////////////////
    coinType: t.field({
      description: "The CoinType of the matching `addr()` record.",
      type: "CoinType",
      nullable: false,
      resolve: (parent) => parent.coinType,
    }),

    //////////////////////////
    // NameReference.resolver
    //////////////////////////
    resolver: t.field({
      description: "The Resolver holding the matching `addr()` record.",
      type: ResolverRef,
      nullable: false,
      resolve: (parent) =>
        makeResolverId({ chainId: parent.resolverChainId, address: parent.resolverAddress }),
    }),

    ///////////////////////
    // NameReference.match
    ///////////////////////
    match: t.field({
      description:
        "Whether this name is the ENSIP-19 Primary Name of this Account for this `coinType` — i.e. the full reverse walk `reverse(address, coinType)` resolves to this exact name (including forward verification), covering both the legacy `addr.reverse` and StandaloneReverseRegistrar (`default.reverse` / `[coinType].reverse`) mechanisms. Resolved from the index (always accelerated; no RPC).",
      type: "Boolean",
      nullable: false,
      resolve: async (parent) => {
        const primaryName = await resolveReverse(parent.account, parent.coinType, {
          accelerate: true,
          canAccelerate: true,
        });
        return primaryName === parent.canonicalName;
      },
    }),
  }),
});
