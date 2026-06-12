import { makeResolverId } from "enssdk";

import { builder } from "@/omnigraph-api/builder";
import type { NameReferenceModel } from "@/omnigraph-api/lib/find-name-references/find-name-references-resolver";
import { DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import { ResolverRef } from "@/omnigraph-api/schema/resolver";

export const NameReferenceRef = builder.objectRef<NameReferenceModel>("NameReference");

/////////////////
// NameReference
/////////////////
NameReferenceRef.implement({
  description: "A Name whose indexed `addr()` record points at an Account.",
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
        "Whether this name is the ENSIP-19 Primary Name of this Account for this `coinType`. i.e. whether reverse resolution of `(address, coinType)` resolves to this exact name. Protocol Accelerated when supported.",
      type: "Boolean",
      nullable: false,
      resolve: async (parent, _args, context) => {
        // the trace is discarded here — `match` only needs the resolved name
        const { result: primaryName } = await context.loaders.reverseResolution.load({
          account: parent.account,
          coinType: parent.coinType,
        });
        return primaryName === parent.canonicalName;
      },
    }),
  }),
});
