import { inArray } from "drizzle-orm";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { AccountIdRef } from "@/omnigraph-api/schema/account-id";

export const EfpAccountMetadataRef = builder.loadableObjectRef("EfpAccountMetadata", {
  load: (ids: string[]) => {
    const { ensDb, ensIndexerSchema } = di.context;
    return ensDb
      .select()
      .from(ensIndexerSchema.efpAccountMetadata)
      .where(inArray(ensIndexerSchema.efpAccountMetadata.id, ids));
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type EfpAccountMetadata = Exclude<typeof EfpAccountMetadataRef.$inferType, string>;

//////////////////////
// EfpAccountMetadata
//////////////////////
EfpAccountMetadataRef.implement({
  description: 'An EFP `(address, key) -> value` account-metadata entry (e.g. "primary-list").',
  fields: (t) => ({
    //////////////////////////
    // EfpAccountMetadata.id
    //////////////////////////
    id: t.field({
      type: "ID",
      nullable: false,
      resolve: (metadata) => metadata.id,
    }),

    ///////////////////////////////
    // EfpAccountMetadata.contract
    ///////////////////////////////
    contract: t.field({
      description: "The CAIP-10 account id of the AccountMetadata contract.",
      type: AccountIdRef,
      nullable: false,
      resolve: (metadata) => ({ chainId: metadata.chainId, address: metadata.contractAddress }),
    }),

    ///////////////////////////////
    // EfpAccountMetadata.address
    ///////////////////////////////
    address: t.field({
      description: "The account this metadata belongs to.",
      type: "Address",
      nullable: false,
      resolve: (metadata) => metadata.address,
    }),

    ///////////////////////////
    // EfpAccountMetadata.key
    ///////////////////////////
    key: t.field({
      description: "The metadata key (UTF-8 string).",
      type: "String",
      nullable: false,
      resolve: (metadata) => metadata.key,
    }),

    /////////////////////////////
    // EfpAccountMetadata.value
    /////////////////////////////
    value: t.field({
      description: "The metadata value (raw bytes).",
      type: "Hex",
      nullable: false,
      resolve: (metadata) => metadata.value,
    }),

    /////////////////////////////////
    // EfpAccountMetadata.createdAt
    /////////////////////////////////
    createdAt: t.field({
      description: "When this metadata entry was first indexed (Unix timestamp, seconds).",
      type: "BigInt",
      nullable: false,
      resolve: (m) => m.createdAt,
    }),

    /////////////////////////////////
    // EfpAccountMetadata.updatedAt
    /////////////////////////////////
    updatedAt: t.field({
      description: "When this metadata entry was last updated (Unix timestamp, seconds).",
      type: "BigInt",
      nullable: false,
      resolve: (m) => m.updatedAt,
    }),
  }),
});
