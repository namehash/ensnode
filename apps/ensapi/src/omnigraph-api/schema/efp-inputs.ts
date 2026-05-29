import { builder } from "@/omnigraph-api/builder";

//////////////////////
// Inputs
//////////////////////

/**
 * Filters for the `efp.lists` connection.
 */
export const EfpListsWhereInput = builder.inputType("EfpListsWhereInput", {
  description: "Filter EFP lists by their owner, user, or manager address.",
  fields: (t) => ({
    owner: t.field({ type: "Address", description: "The ERC-721 owner of the list NFT." }),
    user: t.field({ type: "Address", description: "The address allowed to post records." }),
    manager: t.field({
      type: "Address",
      description: "The address allowed to administer the list.",
    }),
  }),
});

/**
 * Filters for the `efp.listRecords` connection.
 */
export const EfpListRecordsWhereInput = builder.inputType("EfpListRecordsWhereInput", {
  description: "Filter EFP list records.",
  fields: (t) => ({
    recordData: t.field({
      type: "Address",
      description:
        "The target address of an address record (recordType 1). Filtering by this answers 'which lists follow this address?'.",
    }),
    recordType: t.field({ type: "Int", description: "The EFP record type (1 = address)." }),
  }),
});

/**
 * Filters for the `efp.accountMetadatas` connection.
 */
export const EfpAccountMetadatasWhereInput = builder.inputType("EfpAccountMetadatasWhereInput", {
  description: "Filter EFP account metadata.",
  fields: (t) => ({
    address: t.field({ type: "Address", required: true, description: "The account address." }),
  }),
});

/**
 * Filters for the `efp.listPointers` connection.
 */
export const EfpListPointersWhereInput = builder.inputType("EfpListPointersWhereInput", {
  description: "Filter EFP ENS list pointers (the `eth.efp.list` text-record correlation).",
  fields: (t) => ({
    node: t.field({ type: "Node", description: "The ENS namehash that claims a list." }),
    listTokenId: t.field({
      type: "String",
      description: "Find the ENS names that point at this list token id.",
    }),
  }),
});
