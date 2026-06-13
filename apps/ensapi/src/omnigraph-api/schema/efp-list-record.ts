import { inArray } from "drizzle-orm";
import { storageLocationId } from "enssdk/efp";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { AccountRef } from "@/omnigraph-api/schema/account";
import { AccountIdRef } from "@/omnigraph-api/schema/account-id";
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
    id: t.field({
      type: "ID",
      nullable: false,
      resolve: (record) => record.id,
    }),

    //////////////////////////
    // EfpListRecord.contract
    //////////////////////////
    contract: t.field({
      description: "The CAIP-10 account id of the ListRecords contract holding this record.",
      type: AccountIdRef,
      nullable: false,
      resolve: (record) => ({ chainId: record.chainId, address: record.contractAddress }),
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
      description:
        "Canonical record bytes (version | type | address), 0x-prefixed (exactly 22 bytes), with any trailing junk after the 20-byte address truncated.",
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
      resolve: (record) => record.recordData,
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
    createdAt: t.field({
      description: "When this record was first indexed (Unix timestamp, seconds).",
      type: "BigInt",
      nullable: false,
      resolve: (record) => record.createdAt,
    }),

    ///////////////////////
    // EfpListRecord.list
    ///////////////////////
    list: t.loadable({
      description: "The EFP list this record belongs to.",
      type: EfpListRef,
      nullable: true,
      // Resolve each record to its storage-location id, then batch the location -> list lookup in
      // `load` so a page of records resolves all `list` back-refs in two queries rather than one per
      // node (avoids an N+1 on `efp.listRecords { node { list } }`).
      resolve: (record) => storageLocationId(record.chainId, record.contractAddress, record.slot),
      load: async (locationIds: string[]) => {
        const { ensDb, ensIndexerSchema } = di.context;

        const mappings = await ensDb
          .select({
            id: ensIndexerSchema.efpListStorageLocations.id,
            tokenId: ensIndexerSchema.efpListStorageLocations.tokenId,
          })
          .from(ensIndexerSchema.efpListStorageLocations)
          .where(inArray(ensIndexerSchema.efpListStorageLocations.id, locationIds));
        const tokenIdByLocation = new Map(mappings.map((m) => [m.id, m.tokenId]));

        const tokenIds = [...new Set(tokenIdByLocation.values())];
        const lists = tokenIds.length
          ? await ensDb
              .select()
              .from(ensIndexerSchema.efpLists)
              .where(inArray(ensIndexerSchema.efpLists.id, tokenIds))
          : [];
        const listByTokenId = new Map(lists.map((l) => [l.id, l]));

        return locationIds.map((locationId) => {
          const tokenId = tokenIdByLocation.get(locationId);
          return tokenId != null ? (listByTokenId.get(tokenId) ?? null) : null;
        });
      },
    }),

    ///////////////////////////
    // EfpListRecord.account
    ///////////////////////////
    account: t.field({
      description:
        "The Account this record points to (its `recordData`). Always resolvable: an Account exists for any address (see `query.account`), so a record's target can always be walked into its ENS names and own EFP presence.",
      type: AccountRef,
      nullable: false,
      resolve: (record) => record.recordData,
    }),
  }),
});
