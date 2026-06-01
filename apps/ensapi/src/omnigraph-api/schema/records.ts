import type { CoinType, Hex, InterfaceId, NormalizedAddress } from "enssdk";

import { builder } from "@/omnigraph-api/builder";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

//////////////////////////
// ResolvedRawTextRecord
//////////////////////////
export const ResolvedRawTextRecordRef = builder.objectRef<{ key: string; value: string | null }>(
  "ResolvedRawTextRecord",
);

ResolvedRawTextRecordRef.implement({
  description:
    "A resolved 'raw' text record for an ENS name. Value is any possible string and may require additional validation or preprocessing before use.",
  fields: (t) => ({
    key: t.exposeString("key", {
      description: "The text record key.",
      nullable: false,
    }),
    value: t.exposeString("value", {
      description:
        "The 'raw' text record value, or null if not set. Value is any possible string and may require additional validation or preprocessing before use.",
      nullable: true,
    }),
  }),
});

///////////////////////////
// ResolvedAddressRecord
///////////////////////////
export const ResolvedAddressRecordRef = builder.objectRef<{
  coinType: CoinType;
  address: Hex | null;
}>("ResolvedAddressRecord");

ResolvedAddressRecordRef.implement({
  description: "A resolved address record for an ENS name.",
  fields: (t) => ({
    coinType: t.field({
      description: "The coin type for this address record.",
      type: "CoinType",
      nullable: false,
      resolve: (r) => r.coinType,
    }),
    address: t.expose("address", {
      type: "Hex",
      description:
        'The "raw" resolved address record as hex, or null if not set. Decode with ENSIP-9 (https://docs.ens.domains/ensip/9) and address-encoder (https://github.com/ensdomains/address-encoder) for the associated coin type. Guaranteed to be at least one byte of hex data. There is no guarantee that an EVM CoinType returns an address value of any particular byte length.',
      nullable: true,
    }),
  }),
});

////////////////////////
// ResolvedPubkeyRecord
////////////////////////
export const ResolvedPubkeyRecordRef = builder.objectRef<{ x: Hex; y: Hex }>(
  "ResolvedPubkeyRecord",
);

ResolvedPubkeyRecordRef.implement({
  description: "A resolved PubkeyResolver (x, y) pair for an ENS name.",
  fields: (t) => ({
    x: t.field({
      type: "Hex",
      nullable: false,
      resolve: (r) => r.x,
    }),
    y: t.field({
      type: "Hex",
      nullable: false,
      resolve: (r) => r.y,
    }),
  }),
});

///////////////////////
// ResolvedAbiRecord
///////////////////////
export const ResolvedAbiRecordRef = builder.objectRef<{ contentType: bigint; data: Hex }>(
  "ResolvedAbiRecord",
);

ResolvedAbiRecordRef.implement({
  description: "A resolved ABI record for an ENS name.",
  fields: (t) => ({
    contentType: t.field({
      type: "BigInt",
      nullable: false,
      resolve: (r) => r.contentType,
    }),
    data: t.field({
      type: "Hex",
      nullable: false,
      resolve: (r) => r.data,
    }),
  }),
});

////////////////////////////
// ResolvedInterfaceRecord
////////////////////////////
export const ResolvedInterfaceRecordRef = builder.objectRef<{
  interfaceId: InterfaceId;
  implementer: NormalizedAddress | null;
}>("ResolvedInterfaceRecord");

ResolvedInterfaceRecordRef.implement({
  description: "A resolved ERC-165 interface implementer record for an ENS name.",
  fields: (t) => ({
    interfaceId: t.field({
      type: "InterfaceId",
      nullable: false,
      resolve: (r) => r.interfaceId,
    }),
    implementer: t.field({
      type: "Address",
      nullable: true,
      resolve: (r) => r.implementer,
    }),
  }),
});

////////////////////
// ResolvedRecords
////////////////////
export type { ResolvedRecordsModel };

export const ResolvedRecordsRef = builder.objectRef<ResolvedRecordsModel>("ResolvedRecords");

ResolvedRecordsRef.implement({
  description: "Records resolved for a specific ENS name via the ENS protocol.",
  fields: (t) => ({
    reverseName: t.string({
      description:
        "The `name` record value used in Reverse Resolution (ENSIP-19), or null if not set. To reduce a common point of developer confusion the Omnigraph API represents this as the `reverseName` rather than the `name` record which is what this field actually resolves to onchain.",
      nullable: true,
      resolve: (r) => r.name ?? null,
    }),
    contenthash: t.field({
      description: "The ENSIP-7 contenthash record raw bytes, or null if not set.",
      type: "Hex",
      nullable: true,
      resolve: (r) => r.contenthash ?? null,
    }),
    pubkey: t.field({
      description: "The PubkeyResolver (x, y) pair, or null if not set.",
      type: ResolvedPubkeyRecordRef,
      nullable: true,
      resolve: (r) => r.pubkey ?? null,
    }),
    dnszonehash: t.field({
      description: "The IDNSZoneResolver zonehash raw bytes, or null if not set.",
      type: "Hex",
      nullable: true,
      resolve: (r) => r.dnszonehash ?? null,
    }),
    version: t.field({
      description: "The IVersionableResolver version, or null if not set or unavailable.",
      type: "BigInt",
      nullable: true,
      resolve: (r) => r.version ?? null,
    }),
    abi: t.field({
      description:
        "The first stored ABI matching the requested content-type bitmask, or null if not set.",
      type: ResolvedAbiRecordRef,
      nullable: true,
      args: {
        contentTypeMask: t.arg({
          type: "BigInt",
          required: true,
          description:
            "Content-type bitmask; the resolver returns the first stored ABI whose bit is set (lowest bit first).",
        }),
      },
      resolve: (r, { contentTypeMask }) => {
        /*
        ENSIP-4 ABIs are stored with a single-bit contentType (1=JSON, 2=zlib-JSON, etc).
        The selection-building layer merges all requested contentTypeMasks from all 'abi'
        field aliases into a single aggregate mask for the underlying resolution call.
        At this resolver layer, we must verify that the specific ABI returned by the
        protocol (which is the first one found matching the aggregate mask) actually
        matches the specific bitmask requested by *this* GraphQL field alias.

        @see https://docs.ens.domains/ensip/4/
        */
        if (!r.abi) return null;
        // check if the found contentType matches the requested contentTypeMask
        const foundContentType = r.abi.contentType & contentTypeMask;
        if (foundContentType === 0n) return null;
        return r.abi;
      },
    }),
    interfaces: t.field({
      description: "Resolved ERC-165 interface implementer records for the requested ids.",
      type: [ResolvedInterfaceRecordRef],
      nullable: false,
      args: {
        ids: t.arg({
          type: ["InterfaceId"],
          required: true,
          description: "ERC-165 interface ids to resolve (4-byte hex selectors).",
        }),
      },
      resolve: (r, { ids }) =>
        // preserve the order of requested interface ids
        r.interfaces
          ? ids.map((interfaceId) => ({
              interfaceId,
              implementer: r.interfaces?.[interfaceId] ?? null,
            }))
          : [],
    }),
    texts: t.field({
      description: "Resolved text records for the requested keys.",
      type: [ResolvedRawTextRecordRef],
      nullable: false,
      args: {
        keys: t.arg.stringList({
          required: true,
          description: "Text record keys to resolve (e.g. `avatar`, `description`).",
        }),
      },
      resolve: (r, { keys }) =>
        // preserve the order of requested text keys
        r.texts ? keys.map((key) => ({ key, value: r.texts?.[key] ?? null })) : [],
    }),
    addresses: t.field({
      description: "Resolved address records for the requested coin types.",
      type: [ResolvedAddressRecordRef],
      nullable: false,
      args: {
        coinTypes: t.arg({
          type: ["CoinType"],
          required: true,
          description: "Coin types to resolve (e.g. `60` for ETH).",
        }),
      },
      resolve: (r, { coinTypes }) =>
        r.addresses
          ? // preserve the order of requested coin types
            coinTypes.map((coinType) => ({
              coinType,
              address: r.addresses?.[coinType] ?? null,
            }))
          : [],
    }),
  }),
});
