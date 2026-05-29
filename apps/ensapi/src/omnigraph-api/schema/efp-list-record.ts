import { eq, inArray } from "drizzle-orm";
import type { ChainId, NormalizedAddress } from "enssdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { AccountRef } from "@/omnigraph-api/schema/account";
import { efpStorageLocationId } from "@/omnigraph-api/schema/efp-ids";
import { EfpListRef } from "@/omnigraph-api/schema/efp-list";

export const EfpListRecordRef = builder.loadableObjectRef("EfpListRecord", {
  load: (ids: string[]) => {
    const { ensDb, ensIndexerSchema } = di.context;
    return ensDb
      .select()
      .from(ensIndexerSchema.efpListRecords)
      .where(inArray(ensIndexerSchema.efpListRecords.id, ids));
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type EfpListRecord = Exclude<typeof EfpListRecordRef.$inferType, string>;

/////////////////
// EfpListRecord
/////////////////
EfpListRecordRef.implement({
  description: "A single record within an EFP list (an address it follows), with its tags.",
  fields: (t) => ({
    /////////////////////
    // EfpListRecord.id
    /////////////////////
    id: t.field({ type: "String", nullable: false, resolve: (record) => record.id }),

    //////////////////////////
    // EfpListRecord.chainId
    //////////////////////////
    chainId: t.field({
      description: "Chain id of the ListRecords contract holding this record.",
      type: "ChainId",
      nullable: false,
      resolve: (record) => record.chainId as ChainId,
    }),

    //////////////////////////////////
    // EfpListRecord.contractAddress
    //////////////////////////////////
    contractAddress: t.field({
      description: "Address of the ListRecords contract holding this record.",
      type: "Address",
      nullable: false,
      resolve: (record) => record.contractAddress as NormalizedAddress,
    }),

    ////////////////////////
    // EfpListRecord.slot
    ////////////////////////
    slot: t.field({
      description: "The list's storage slot (bytes32) within the ListRecords contract.",
      type: "Hex",
      nullable: false,
      resolve: (record) => record.slot,
    }),

    //////////////////////////
    // EfpListRecord.record
    //////////////////////////
    record: t.field({
      description: "The full record payload (version | type | data).",
      type: "Hex",
      nullable: false,
      resolve: (record) => record.record,
    }),

    //////////////////////////////
    // EfpListRecord.recordType
    //////////////////////////////
    recordType: t.field({
      description: "The EFP record type (1 = address).",
      type: "Int",
      nullable: false,
      resolve: (record) => record.recordType,
    }),

    //////////////////////////////
    // EfpListRecord.recordData
    //////////////////////////////
    recordData: t.field({
      description:
        "The followed/target address (the record's 20-byte payload). EFP indexes only address records (recordType 1).",
      type: "Address",
      nullable: false,
      resolve: (record) => record.recordData as NormalizedAddress,
    }),

    ////////////////////////
    // EfpListRecord.tags
    ////////////////////////
    tags: t.field({
      description: 'UTF-8 tags attached to this record (e.g. "close-friend", "block").',
      type: ["String"],
      nullable: false,
      resolve: (record) => record.tags,
    }),

    /////////////////////////////
    // EfpListRecord.createdAt
    /////////////////////////////
    createdAt: t.field({ type: "BigInt", nullable: false, resolve: (record) => record.createdAt }),

    ///////////////////////
    // EfpListRecord.list
    ///////////////////////
    list: t.field({
      description: "The EFP list this record belongs to.",
      type: EfpListRef,
      nullable: true,
      resolve: async (record) => {
        const { ensDb, ensIndexerSchema } = di.context;
        const [mapping] = await ensDb
          .select({ tokenId: ensIndexerSchema.efpListStorageLocations.tokenId })
          .from(ensIndexerSchema.efpListStorageLocations)
          .where(
            eq(
              ensIndexerSchema.efpListStorageLocations.id,
              efpStorageLocationId(record.chainId, record.contractAddress, record.slot),
            ),
          )
          .limit(1);
        return mapping?.tokenId ?? null;
      },
    }),

    ///////////////////////////
    // EfpListRecord.account
    ///////////////////////////
    account: t.field({
      description:
        "The account this record points to (its `recordData`). Null if that address is not an indexed account.",
      type: AccountRef,
      nullable: true,
      resolve: (record) => record.recordData as NormalizedAddress,
    }),
  }),
});
