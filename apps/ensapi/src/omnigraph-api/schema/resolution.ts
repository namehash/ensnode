import type {
  CoinType,
  DefaultableChainId,
  Hex,
  InterfaceId,
  InterpretedName,
  NormalizedAddress,
} from "enssdk";

import type { ResolverRecordsResponseBase } from "@ensnode/ensnode-sdk";

import { builder } from "@/omnigraph-api/builder";

//////////////////////
// PrimaryNameByChain
//////////////////////
export const PrimaryNameByChainRef = builder
  .objectRef<{ chainId: DefaultableChainId; name: InterpretedName | null }>("PrimaryNameByChain")
  .implement({
    description: "An ENSIP-19 primary name for an Account on a specific chain.",
    fields: (t) => ({
      chainId: t.field({
        description:
          "The chain on which the primary name was resolved. 0 denotes the default EVM chain per ENSIP-19.",
        type: "DefaultableChainId",
        nullable: false,
        resolve: (r) => r.chainId,
      }),
      name: t.field({
        description:
          "The validated primary name for this Account on this chain, or null if none is set.",
        type: "InterpretedName",
        nullable: true,
        resolve: (r) => r.name,
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

////////////////////////
// ResolvedPubkeyRecord
////////////////////////
export const ResolvedPubkeyRecordRef = builder
  .objectRef<{ x: Hex; y: Hex }>("ResolvedPubkeyRecord")
  .implement({
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
export const ResolvedAbiRecordRef = builder
  .objectRef<{ contentType: bigint; data: Hex }>("ResolvedAbiRecord")
  .implement({
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
export const ResolvedInterfaceRecordRef = builder
  .objectRef<{ interfaceId: InterfaceId; implementer: NormalizedAddress | null }>(
    "ResolvedInterfaceRecord",
  )
  .implement({
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
export const ResolvedRecordsRef = builder
  .objectRef<Partial<ResolverRecordsResponseBase>>("ResolvedRecords")
  .implement({
    description: "Records resolved for a specific ENS name via the ENS protocol.",
    fields: (t) => ({
      reverseName: t.string({
        description:
          "The `name` record value used in Reverse Resolution (ENSIP-19), or null if not set.",
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
        resolve: (r) => r.abi ?? null,
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
        resolve: (r) =>
          r.interfaces
            ? Object.entries(r.interfaces).map(([interfaceId, implementer]) => ({
                interfaceId: interfaceId as InterfaceId,
                implementer,
              }))
            : [],
      }),
      texts: t.field({
        description: "Resolved text records for the requested keys.",
        type: [ResolvedTextRecordRef],
        nullable: false,
        args: {
          keys: t.arg.stringList({
            required: true,
            description: "Text record keys to resolve (e.g. `avatar`, `description`).",
          }),
        },
        resolve: (r) =>
          r.texts ? Object.entries(r.texts).map(([key, value]) => ({ key, value })) : [],
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
