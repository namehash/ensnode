import { inArray } from "drizzle-orm";
import type { ChainId, Node, NormalizedAddress } from "enssdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";

export const EfpListPointerRef = builder.loadableObjectRef("EfpListPointer", {
  load: (ids: string[]) => {
    const { ensDb, ensIndexerSchema } = di.context;
    return ensDb
      .select()
      .from(ensIndexerSchema.efpEnsListPointers)
      .where(inArray(ensIndexerSchema.efpEnsListPointers.id, ids));
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type EfpListPointer = Exclude<typeof EfpListPointerRef.$inferType, string>;

//////////////////
// EfpListPointer
//////////////////
EfpListPointerRef.implement({
  description:
    "A correlation between an ENS name (via its `eth.efp.list` text record) and an EFP list.",
  fields: (t) => ({
    ////////////////////////
    // EfpListPointer.id
    ////////////////////////
    id: t.field({ type: "String", nullable: false, resolve: (pointer) => pointer.id }),

    /////////////////////////////
    // EfpListPointer.chainId
    /////////////////////////////
    chainId: t.field({
      description: "Chain id of the resolver that emitted the text record.",
      type: "ChainId",
      nullable: false,
      resolve: (pointer) => pointer.chainId as ChainId,
    }),

    //////////////////////////////
    // EfpListPointer.resolver
    //////////////////////////////
    resolver: t.field({
      description: "The resolver contract address.",
      type: "Address",
      nullable: false,
      resolve: (pointer) => pointer.resolver as NormalizedAddress,
    }),

    //////////////////////////
    // EfpListPointer.node
    //////////////////////////
    node: t.field({
      description: "The ENS namehash whose `eth.efp.list` text record points at a list.",
      type: "Node",
      nullable: false,
      resolve: (pointer) => pointer.node as Node,
    }),

    ////////////////////////////
    // EfpListPointer.ensKey
    ////////////////////////////
    ensKey: t.field({
      description: "The matched ENS text-record key (e.g. `eth.efp.list`).",
      type: "String",
      nullable: false,
      resolve: (pointer) => pointer.ensKey,
    }),

    //////////////////////////////
    // EfpListPointer.rawValue
    //////////////////////////////
    rawValue: t.field({
      description: "The raw text-record value, kept verbatim.",
      type: "String",
      nullable: false,
      resolve: (pointer) => pointer.rawValue,
    }),

    /////////////////////////////////
    // EfpListPointer.listTokenId
    /////////////////////////////////
    listTokenId: t.field({
      description: "Decoded list token id (decimal string).",
      type: "String",
      nullable: false,
      resolve: (pointer) => pointer.listTokenId,
    }),

    /////////////////////////////////
    // EfpListPointer.listContract
    /////////////////////////////////
    listContract: t.field({
      description: "Decoded list contract address (defaults to the EFP ListRegistry on Base).",
      type: "Address",
      nullable: false,
      resolve: (pointer) => pointer.listContract as NormalizedAddress,
    }),

    ////////////////////////////////
    // EfpListPointer.listChainId
    ////////////////////////////////
    listChainId: t.field({
      description: "Decoded list chain id (defaults to 8453 / Base).",
      type: "ChainId",
      nullable: false,
      resolve: (pointer) => pointer.listChainId as ChainId,
    }),

    ////////////////////////////////
    // EfpListPointer.createdAt
    ////////////////////////////////
    createdAt: t.field({ type: "BigInt", nullable: false, resolve: (p) => p.createdAt }),

    ////////////////////////////////
    // EfpListPointer.updatedAt
    ////////////////////////////////
    updatedAt: t.field({ type: "BigInt", nullable: false, resolve: (p) => p.updatedAt }),
  }),
});
