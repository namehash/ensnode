import type { CoinType } from "enssdk";

import { builder } from "@/omnigraph-api/builder";

///////////////////////
// ResolveSelectionInput
///////////////////////
export const ResolveSelectionInput = builder.inputType("ResolveSelectionInput", {
  description:
    "Specifies which ENS records to resolve. At least one field must be set to receive any records.",
  fields: (t) => ({
    reverseName: t.boolean({
      description: "Whether to resolve the `name` record (used in Reverse Resolution, ENSIP-19).",
      required: false,
    }),
    texts: t.stringList({
      description: "Text record keys to resolve (e.g. `avatar`, `description`, `com.).",
      required: false,
    }),
    addresses: t.field({
      description: "Coin types to resolve address records for (e.g. `60` for ETH).",
      type: ["CoinType"],
      required: false,
    }),
  }),
});

///////////////////////
// ResolvedTextRecord
///////////////////////
export const ResolvedTextRecordRef = builder
  .objectRef<{ key: string; value: string | null }>("ResolvedTextRecord")
  .implement({
    description: "A resolved text record for an ENS name.",
    fields: (t) => ({
      key: t.exposeString("key", {
        description: "The text record key.",
        nullable: false,
      }),
      value: t.exposeString("value", {
        description: "The text record value, or null if not set.",
        nullable: true,
      }),
    }),
  });

///////////////////////////
// ResolvedAddressRecord
///////////////////////////
export const ResolvedAddressRecordRef = builder
  .objectRef<{ coinType: CoinType; address: string | null }>("ResolvedAddressRecord")
  .implement({
    description: "A resolved address record for an ENS name.",
    fields: (t) => ({
      coinType: t.field({
        description: "The coin type for this address record.",
        type: "CoinType",
        nullable: false,
        resolve: (r) => r.coinType,
      }),
      address: t.exposeString("address", {
        description: "The address value, or null if not set.",
        nullable: true,
      }),
    }),
  });

////////////////////
// ResolvedRecords
////////////////////
export const ResolvedRecordsRef = builder
  .objectRef<{
    name: string | null | undefined;
    texts: Record<string, string | null> | undefined;
    addresses: Record<CoinType, string | null> | undefined;
  }>("ResolvedRecords")
  .implement({
    description:
      "Records resolved for a specific ENS name via the ENS protocol. Only selected records are populated.",
    fields: (t) => ({
      reverseName: t.string({
        description:
          "The `name` record value used in Reverse Resolution (ENSIP-19), or null if not set or not selected.",
        nullable: true,
        resolve: (r) => r.name ?? null,
      }),
      texts: t.field({
        description: "Resolved text records for selected keys.",
        type: [ResolvedTextRecordRef],
        nullable: false,
        resolve: (r) =>
          r.texts ? Object.entries(r.texts).map(([key, value]) => ({ key, value })) : [],
      }),
      addresses: t.field({
        description: "Resolved address records for selected coin types.",
        type: [ResolvedAddressRecordRef],
        nullable: false,
        resolve: (r) =>
          r.addresses
            ? Object.entries(r.addresses).map(([coinType, address]) => ({
                coinType: Number(coinType) as CoinType,
                address,
              }))
            : [],
      }),
    }),
  });
