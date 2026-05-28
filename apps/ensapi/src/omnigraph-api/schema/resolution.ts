import {
  type Address,
  type CoinType,
  type Hex,
  type InterfaceId,
  type InterpretedName,
  isNormalizedName,
  type JsonValue,
  type NormalizedAddress,
} from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import { resolveForward } from "@/lib/resolution/forward-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import { builder } from "@/omnigraph-api/builder";
import { INCLUDE_DEV_METHODS } from "@/omnigraph-api/lib/include-dev-methods";
import {
  ENSIP19_CHAIN_VALUES,
  type ENSIP19ChainValue,
} from "@/omnigraph-api/lib/resolution/chain-coin-type";
import {
  type ResolvedRecordsModel,
  toResolvedRecordsModel,
} from "@/omnigraph-api/lib/resolution/records-profile-model";
import { buildRecordsSelectionFromResolveContainerInfo } from "@/omnigraph-api/lib/resolution/records-selection";
import { CanonicalNameRef } from "@/omnigraph-api/schema/canonical-name";

export type AccelerationStatusModel = {
  requested: boolean;
  attempted: boolean;
};

export const AccelerationStatusRef =
  builder.objectRef<AccelerationStatusModel>("AccelerationStatus");

AccelerationStatusRef.implement({
  description: "Execution status metadata for a resolver strategy.",
  fields: (t) => ({
    requested: t.exposeBoolean("requested", {
      description: "Whether this strategy was requested by the caller.",
      nullable: false,
    }),
    attempted: t.exposeBoolean("attempted", {
      description: "Whether this strategy was attempted at runtime.",
      nullable: false,
    }),
  }),
});

//////////////////
// ENSIP19Chain
//////////////////
export const ENSIP19Chain = builder.enumType("ENSIP19Chain", {
  description:
    "ENSIP-19 supported chains that can have a primary name. Use `DEFAULT` for the ENSIP-19 default EVM chain.\n@see https://github.com/ensdomains/address-encoder/blob/master/docs/supported-cryptocurrencies.md for more details.",
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

export const AccountPrimaryNamesWhereInput = builder.inputType("AccountPrimaryNamesWhereInput", {
  description:
    "Filter primary name lookups. Exactly one of `coinTypes` or `chains` must be provided.",
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
type ProfileSectionModel = Record<string, never>;

export const ProfileSocialAccountRef =
  builder.objectRef<ProfileSectionModel>("ProfileSocialAccount");

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

export const ProfileSocialsRef = builder.objectRef<ProfileSectionModel>("ProfileSocials");

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

export const ProfileAddressesRef = builder.objectRef<ProfileSectionModel>("ProfileAddresses");

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

export const ProfileAvatarRef = builder.objectRef<ProfileSectionModel>("ProfileAvatar");

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

export const ProfileBannerRef = builder.objectRef<ProfileSectionModel>("ProfileBanner");

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

export const ProfileWebsiteRef = builder.objectRef<ProfileSectionModel>("ProfileWebsite");

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

export const DomainProfileRef = builder.objectRef<ProfileSectionModel>("DomainProfile");

DomainProfileRef.implement({
  description:
    "PREVIEW: An interpreted ENS profile for a name. Types are defined for query ergonomics; resolution is not yet wired.",
  fields: (t) => ({
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
export type { ResolvedRecordsModel };

export const ResolvedRecordsRef = builder.objectRef<ResolvedRecordsModel>("ResolvedRecords");

ResolvedRecordsRef.implement({
  description: "Records resolved for a specific ENS name via the ENS protocol.",
  fields: (t) => ({
    id: t.field({
      description: "Stable cache key for these records: the InterpretedName used to resolve them.",
      type: "UID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),
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

//////////////////////
// PrimaryNameRecord
//////////////////////
export type PrimaryNameRecordModel = {
  address: Address;
  coinType: CoinType;
  chain: ENSIP19ChainValue | null;
  name: InterpretedName | null;
};

/** GraphQL parent for `PrimaryNameRecord`, including `AccountResolve` acceleration settings. */
export type PrimaryNameRecordParent = PrimaryNameRecordModel & {
  accelerate: boolean;
};

type PrimaryNameRecordsResult = {
  trace: TracingTrace;
  records: ResolvedRecordsModel;
};

type PrimaryNameResolveModel = {
  parent: PrimaryNameRecordParent;
  recordsResolution: Promise<PrimaryNameRecordsResult> | null;
};

export const PrimaryNameRecordRef = builder.objectRef<PrimaryNameRecordParent>("PrimaryNameRecord");
export const PrimaryNameResolveRef =
  builder.objectRef<PrimaryNameResolveModel>("PrimaryNameResolve");

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
      type: CanonicalNameRef,
      nullable: true,
      resolve: (r) => (r.name ? { canonicalName: r.name } : null),
    }),
    resolve: t.field({
      description:
        "Resolve protocol-level records (and optionally profile preview) for this primary name.",
      type: PrimaryNameResolveRef,
      nullable: false,
      resolve: (parent, _args, context, info) => {
        const { name, accelerate } = parent;
        const { canAccelerate } = context;

        const recordsSelection =
          name && isNormalizedName(name)
            ? buildRecordsSelectionFromResolveContainerInfo(info)
            : null;

        const recordsResolution =
          name && recordsSelection
            ? runWithTrace(() =>
                resolveForward(name, recordsSelection, { accelerate, canAccelerate }),
              ).then(({ trace, result }) => ({
                trace,
                records: toResolvedRecordsModel(name, result),
              }))
            : null;

        return { parent, recordsResolution };
      },
    }),
  }),
});

PrimaryNameResolveRef.implement({
  description:
    "Nested resolution container for a PrimaryNameRecord, including acceleration settings and resolved data.",
  fields: (t) => ({
    trace: t.field({
      description:
        "Protocol trace tree emitted by resolution, represented as JSON for schema stability.",
      type: "JSON",
      nullable: true,
      resolve: async ({ recordsResolution }) => {
        if (!recordsResolution) return null;
        return (await recordsResolution).trace as unknown as JsonValue;
      },
    }),
    acceleration: t.field({
      description: "Protocol acceleration strategy status for this primary name resolution.",
      type: AccelerationStatusRef,
      nullable: false,
      resolve: ({ parent }, _args, context) => ({
        requested: parent.accelerate,
        attempted: parent.accelerate && context.canAccelerate,
      }),
    }),
    records: t.field({
      description:
        "Forward-resolve ENS records for the validated primary name. Null when `name` is null.",
      type: ResolvedRecordsRef,
      nullable: true,
      tracing: true,
      resolve: async ({ recordsResolution }) => {
        if (!recordsResolution) return null;
        return (await recordsResolution).records;
      },
    }),
    ...(INCLUDE_DEV_METHODS && {
      profile: t.field({
        description:
          "PREVIEW: An interpreted ENS profile for the validated primary name. Not yet resolved.",
        type: DomainProfileRef,
        nullable: true,
        resolve: ({ parent }) => (parent.name ? {} : null),
      }),
    }),
  }),
});
