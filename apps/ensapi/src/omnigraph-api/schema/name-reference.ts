import { makeResolverId } from "enssdk";

import { getENSIP19ReverseNameRecordFromIndex } from "@/lib/protocol-acceleration/get-primary-name-from-index";
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
    "A Name whose indexed `addr()` record points at an Account, surfaced by `Account.nameReferences`. Reflects literally-indexed records only: no Forward Resolution / CCIP-Read and no ENSIP-19 default-address-record expansion.",
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
        "Whether the indexed ENSIP-19 reverse lookup `reverse(address, coinType)` resolves to this exact name. Uses the indexed StandaloneReverseRegistrar shortcut (`default.reverse` / `[coinType].reverse`); it does NOT perform a full `*.addr.reverse` ENSIP-19 reverse walk.",
      type: "Boolean",
      nullable: false,
      resolve: async (parent) => {
        const reverseName = await getENSIP19ReverseNameRecordFromIndex(
          parent.account,
          parent.coinType,
        );
        return reverseName === parent.canonicalName;
      },
    }),
  }),
});
