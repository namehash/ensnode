import type {
  Address,
  CoinType,
  Hex,
  InterfaceId,
  InterpretedName,
  NormalizedAddress,
} from "enssdk";

import type { ResolverRecordsResponseBase } from "@ensnode/ensnode-sdk";

import { resolveForward } from "@/lib/resolution/forward-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import { builder } from "@/omnigraph-api/builder";
import { buildRecordsSelectionFromResolveInfo } from "@/omnigraph-api/lib/resolution/build-records-selection";
import {
  ENSIP19_CHAIN_VALUES,
  type ENSIP19ChainValue,
} from "@/omnigraph-api/lib/resolution/chain-coin-type";

//////////////////
// ENSIP19Chain
//////////////////
export const ENSIP19Chain = builder.enumType("ENSIP19Chain", {
  description:
    "ENSIP-19 supported chains that can have a primary name. Non-EVM coin types are intentionally absent.",
  values: ENSIP19_CHAIN_VALUES,
});

///////////////////////
// PrimaryName inputs
///////////////////////
export const PrimaryNameByInput = builder.inputType("PrimaryNameByInput", {
  description:
    "Select a primary name lookup target. Exactly one of `coinType` or `chain` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    coinType: t.field({
      type: "CoinType",
      description: "The ENSIP-9 coin type to resolve the primary name for.",
    }),
    chain: t.field({
      type: ENSIP19Chain,
      description: "An ENSIP-19 supported chain to resolve the primary name for.",
    }),
  }),
});

export const PrimaryNamesByInput = builder.inputType("PrimaryNamesByInput", {
  description:
    "Select primary name lookup targets. Exactly one of `coinTypes` or `chains` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    coinTypes: t.field({
      type: ["CoinType"],
      description: "Coin types to resolve primary names for.",
      validate: { minLength: 1 },
    }),
    chains: t.field({
      type: [ENSIP19Chain],
      description: "ENSIP-19 supported chains to resolve primary names for.",
      validate: { minLength: 1 },
    }),
  }),
});

//////////////////////
// DomainProfile (preview — types only, no resolution wired yet)
//////////////////////
export type DomainProfileModel = Record<string, never>;

export const ProfileSocialAccountRef =
  builder.objectRef<DomainProfileModel>("ProfileSocialAccount");

ProfileSocialAccountRef.implement({
  description: "PREVIEW: An interpreted social account on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    handle: t.string({
      description: "The social handle, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
    url: t.string({
      description: "The social profile URL, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

export const ProfileSocialsRef = builder.objectRef<DomainProfileModel>("ProfileSocials");

ProfileSocialsRef.implement({
  description: "PREVIEW: Interpreted social accounts on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    github: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: () => ({}),
    }),
    telegram: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: () => ({}),
    }),
    twitter: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: () => ({}),
    }),
  }),
});

export const ProfileAddressesRef = builder.objectRef<DomainProfileModel>("ProfileAddresses");

ProfileAddressesRef.implement({
  description: "PREVIEW: Interpreted address records on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    ethereum: t.field({
      description: "The interpreted Ethereum address, or null when unset.",
      type: "Address",
      nullable: true,
      resolve: () => null,
    }),
    base: t.field({
      description: "The interpreted Base address, or null when unset.",
      type: "Address",
      nullable: true,
      resolve: () => null,
    }),
    bitcoin: t.string({
      description: "The interpreted Bitcoin address, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
    solana: t.string({
      description: "The interpreted Solana address, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

export const ProfileNameRef = builder.objectRef<DomainProfileModel>("ProfileName");

ProfileNameRef.implement({
  description: "PREVIEW: Interpreted name metadata on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    beautified: t.string({
      description: "The beautified display form of the name, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
    normalized: t.string({
      description: "The normalized form of the name, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

export const ProfileAvatarRef = builder.objectRef<DomainProfileModel>("ProfileAvatar");

ProfileAvatarRef.implement({
  description: "PREVIEW: Interpreted avatar metadata on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    url: t.string({
      description: "The resolved avatar URL, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

export const ProfileBannerRef = builder.objectRef<DomainProfileModel>("ProfileBanner");

ProfileBannerRef.implement({
  description: "PREVIEW: Interpreted banner metadata on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    url: t.string({
      description: "The resolved banner URL, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

export const ProfileWebsiteRef = builder.objectRef<DomainProfileModel>("ProfileWebsite");

ProfileWebsiteRef.implement({
  description: "PREVIEW: Interpreted website metadata on a Domain profile. Not yet resolved.",
  fields: (t) => ({
    url: t.string({
      description: "The resolved website URL, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

export const DomainProfileRef = builder.objectRef<DomainProfileModel>("DomainProfile");

DomainProfileRef.implement({
  description:
    "PREVIEW: An interpreted ENS profile for a name. Types are defined for query ergonomics; resolution is not yet wired.",
  fields: (t) => ({
    name: t.field({
      type: ProfileNameRef,
      nullable: true,
      resolve: () => ({}),
    }),
    avatar: t.field({
      type: ProfileAvatarRef,
      nullable: true,
      resolve: () => ({}),
    }),
    banner: t.field({
      type: ProfileBannerRef,
      nullable: true,
      resolve: () => ({}),
    }),
    website: t.field({
      type: ProfileWebsiteRef,
      nullable: true,
      resolve: () => ({}),
    }),
    description: t.string({
      description: "The profile description, or null when unset.",
      nullable: true,
      resolve: () => null,
    }),
    addresses: t.field({
      type: ProfileAddressesRef,
      nullable: true,
      resolve: () => ({}),
    }),
    socials: t.field({
      type: ProfileSocialsRef,
      nullable: true,
      resolve: () => ({}),
    }),
  }),
});

///////////////////////
// ResolvedTextRecord
///////////////////////
export const ResolvedTextRecordRef = builder.objectRef<{ key: string; value: string | null }>(
  "ResolvedTextRecord",
);

ResolvedTextRecordRef.implement({
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
export const ResolvedAddressRecordRef = builder.objectRef<{
  coinType: CoinType;
  address: string | null;
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
    address: t.exposeString("address", {
      description: "The address value, or null if not set.",
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
export const ResolvedRecordsRef =
  builder.objectRef<Partial<ResolverRecordsResponseBase>>("ResolvedRecords");

ResolvedRecordsRef.implement({
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
      type: [ResolvedTextRecordRef],
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

//////////////////////
// PrimaryNameRecord
//////////////////////
export type PrimaryNameRecordModel = {
  address: Address;
  coinType: CoinType;
  chain: ENSIP19ChainValue | null;
  name: InterpretedName | null;
  disableAcceleration: boolean;
  canAccelerate: boolean;
};

export const PrimaryNameRecordRef = builder.objectRef<PrimaryNameRecordModel>("PrimaryNameRecord");

PrimaryNameRecordRef.implement({
  description: "An ENSIP-19 primary name for an Account on a specific coin type.",
  fields: (t) => ({
    coinType: t.field({
      description: "The canonical ENSIP-9 coin type for this primary name lookup.",
      type: "CoinType",
      nullable: false,
      resolve: (r) => r.coinType,
    }),
    chain: t.field({
      description:
        "The ENSIP-19 chain corresponding to `coinType`, or null when `coinType` is not represented in `ENSIP19Chain`.",
      type: ENSIP19Chain,
      nullable: true,
      resolve: (r) => r.chain,
    }),
    name: t.field({
      description:
        "The validated primary name for this Account on this coin type, or null if none is set.",
      type: "InterpretedName",
      nullable: true,
      resolve: (r) => r.name,
    }),
    records: t.field({
      description:
        "Forward-resolve ENS records for the validated primary name. Null when `name` is null.",
      type: ResolvedRecordsRef,
      nullable: true,
      tracing: true,
      resolve: async (parent, _args, context, info) => {
        const name = parent.name;
        if (!name) return null;

        const recordsSelection = buildRecordsSelectionFromResolveInfo(info);
        const { result } = await runWithTrace(() =>
          resolveForward(name, recordsSelection, {
            accelerate: !parent.disableAcceleration,
            canAccelerate: context.canAccelerate,
          }),
        );

        return result as ResolverRecordsResponseBase;
      },
    }),
    profile: t.field({
      description:
        "PREVIEW: An interpreted ENS profile for the validated primary name. Not yet resolved.",
      type: DomainProfileRef,
      nullable: false,
      resolve: () => ({}),
    }),
  }),
});
