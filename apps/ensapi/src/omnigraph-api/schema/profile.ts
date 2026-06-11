import { builder } from "@/omnigraph-api/builder";
import type { ProfileContenthashModel } from "@/omnigraph-api/lib/resolution/profile/interpreters";
import {
  ADDRESS_INTERPRETERS,
  ProfileAvatarInterpreter,
  ProfileContenthashInterpreter,
  ProfileDescriptionInterpreter,
  ProfileEmailInterpreter,
  ProfileHeaderInterpreter,
  ProfileWebsiteInterpreter,
  SOCIAL_INTERPRETERS,
} from "@/omnigraph-api/lib/resolution/profile/interpreters";
import {
  profileAddressesContainerDescription,
  profileAddressFieldDescription,
  profileContenthashDescription,
  profileImageHttpUrlFieldDescription,
  profileSocialFieldDescription,
  profileSocialsContainerDescription,
  profileWebsiteFieldDescription,
} from "@/omnigraph-api/lib/resolution/profile/profile-descriptions";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

export type { ProfileContenthashModel };

export const ProfileContenthashRef =
  builder.objectRef<ProfileContenthashModel>("ProfileContenthash");

ProfileContenthashRef.implement({
  description: "The interpreted ENSIP-7 contenthash on the profile of an ENS name.",
  fields: (t) => ({
    protocolType: t.exposeString("protocolType", {
      description: 'The protocol type identifier (e.g. "ipfs", "ipns", "swarm", "arweave").',
      nullable: false,
    }),
    decoded: t.exposeString("decoded", {
      description:
        "The decoded, human-readable content identifier (e.g. a CID for IPFS, transaction ID for Arweave).",
      nullable: false,
    }),
    uri: t.exposeString("uri", {
      description:
        'The canonical protocol-native URI (e.g. "ipfs://bafy…", "ar://…", "bzz://…").',
      nullable: false,
    }),
    httpUrl: t.exposeString("httpUrl", {
      description:
        "The default public HTTP gateway URL for fetching this content in a browser (e.g. https://ipfs.io/ipfs/…). Null for protocols with no well-known public gateway (onion, skynet).",
      nullable: true,
    }),
  }),
});

export type ProfileSocialAccountModel = { handle: string; httpUrl: string };
export type ProfileImageModel = { httpUrl: string | null };

export const ProfileSocialAccountRef =
  builder.objectRef<ProfileSocialAccountModel>("ProfileSocialAccount");

ProfileSocialAccountRef.implement({
  description: "An interpreted social account on the profile of an ENS name.",
  fields: (t) => ({
    handle: t.exposeString("handle", {
      description: "The handle of the social account.",
      nullable: false,
    }),
    httpUrl: t.exposeString("httpUrl", {
      description: "The HTTP-compatible url to the social account.",
      nullable: false,
    }),
  }),
});

export const ProfileSocialsRef = builder.objectRef<ResolvedRecordsModel>("ProfileSocials");

ProfileSocialsRef.implement({
  description: profileSocialsContainerDescription,
  fields: (t) => ({
    github: t.field({
      description: profileSocialFieldDescription("GitHub"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_INTERPRETERS.github.interpret(model),
    }),
    telegram: t.field({
      description: profileSocialFieldDescription("Telegram"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_INTERPRETERS.telegram.interpret(model),
    }),
    twitter: t.field({
      description: profileSocialFieldDescription("X (Twitter)"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_INTERPRETERS.twitter.interpret(model),
    }),
    linkedin: t.field({
      description: profileSocialFieldDescription("LinkedIn"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_INTERPRETERS.linkedin.interpret(model),
    }),
    keybase: t.field({
      description: profileSocialFieldDescription("Keybase"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_INTERPRETERS.keybase.interpret(model),
    }),
  }),
});

export const ProfileAddressesRef = builder.objectRef<ResolvedRecordsModel>("ProfileAddresses");

ProfileAddressesRef.implement({
  description: profileAddressesContainerDescription,
  fields: (t) => ({
    ethereum: t.field({
      description: profileAddressFieldDescription("Ethereum"),
      type: "Address",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.ethereum.interpret(model),
    }),
    base: t.field({
      description: profileAddressFieldDescription("Base"),
      type: "Address",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.base.interpret(model),
    }),
    bitcoin: t.field({
      description: profileAddressFieldDescription("Bitcoin"),
      type: "BitcoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.bitcoin.interpret(model),
    }),
    solana: t.field({
      description: profileAddressFieldDescription("Solana"),
      type: "SolanaAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.solana.interpret(model),
    }),
    litecoin: t.field({
      description: profileAddressFieldDescription("Litecoin"),
      type: "LitecoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.litecoin.interpret(model),
    }),
    dogecoin: t.field({
      description: profileAddressFieldDescription("Dogecoin"),
      type: "DogecoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.dogecoin.interpret(model),
    }),
    monacoin: t.field({
      description: profileAddressFieldDescription("Monacoin"),
      type: "MonacoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.monacoin.interpret(model),
    }),
    rootstock: t.field({
      description: profileAddressFieldDescription("Rootstock (RBTC)"),
      type: "RootstockAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.rootstock.interpret(model),
    }),
    ripple: t.field({
      description: profileAddressFieldDescription("Ripple (XRP)"),
      type: "RippleAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.ripple.interpret(model),
    }),
    bitcoincash: t.field({
      description: profileAddressFieldDescription("Bitcoin Cash"),
      type: "BitcoinCashAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.bitcoincash.interpret(model),
    }),
    binance: t.field({
      description: profileAddressFieldDescription("Binance Chain (BNB)"),
      type: "BinanceAddress",
      nullable: true,
      resolve: (model) => ADDRESS_INTERPRETERS.binance.interpret(model),
    }),
  }),
});

export const ProfileAvatarRef = builder.objectRef<ProfileImageModel>("ProfileAvatar");

ProfileAvatarRef.implement({
  description: "The interpreted avatar image on the profile of an ENS name.",
  fields: (t) => ({
    httpUrl: t.exposeString("httpUrl", {
      description: profileImageHttpUrlFieldDescription("avatar"),
      nullable: true,
    }),
  }),
});

export const ProfileHeaderRef = builder.objectRef<ProfileImageModel>("ProfileHeader");

ProfileHeaderRef.implement({
  description: "The interpreted header image on the profile of an ENS name.",
  fields: (t) => ({
    httpUrl: t.exposeString("httpUrl", {
      description: profileImageHttpUrlFieldDescription("header"),
      nullable: true,
    }),
  }),
});

export const ProfileWebsiteRef = builder.objectRef<ResolvedRecordsModel>("ProfileWebsite");

ProfileWebsiteRef.implement({
  description: profileWebsiteFieldDescription,
  fields: (t) => ({
    httpUrl: t.string({
      description:
        "The HTTP-compatible website URL. Returns null when the raw url record is unset, empty, not an http(s) URL, or cannot be parsed as a valid URL.",
      nullable: true,
      resolve: (model) => ProfileWebsiteInterpreter.interpret(model),
    }),
  }),
});

export const DomainProfileRef = builder.objectRef<ResolvedRecordsModel>("DomainProfile");

DomainProfileRef.implement({
  description: "The interpreted profile of an ENS name.",
  fields: (t) => ({
    avatar: t.field({
      description:
        "Interpreted avatar metadata. Returns null when the raw avatar record is unset or empty.",
      type: ProfileAvatarRef,
      nullable: true,
      resolve: (model) => ProfileAvatarInterpreter.interpret(model),
    }),
    header: t.field({
      description:
        "Interpreted header metadata. Returns null when the raw header record is unset or empty.",
      type: ProfileHeaderRef,
      nullable: true,
      resolve: (model) => ProfileHeaderInterpreter.interpret(model),
    }),
    website: t.field({
      description: profileWebsiteFieldDescription,
      type: ProfileWebsiteRef,
      nullable: true,
      resolve: (model) => (ProfileWebsiteInterpreter.interpret(model) ? model : null),
    }),
    description: t.string({
      description: "The interpreted description on the profile of an ENS name, or null when unset.",
      nullable: true,
      resolve: (model) => ProfileDescriptionInterpreter.interpret(model),
    }),
    email: t.field({
      description:
        "The interpreted email address on the profile of an ENS name, or null when unset or invalid.",
      type: "Email",
      nullable: true,
      resolve: (model) => ProfileEmailInterpreter.interpret(model),
    }),
    contenthash: t.field({
      description: profileContenthashDescription,
      type: ProfileContenthashRef,
      nullable: true,
      resolve: (model) => ProfileContenthashInterpreter.interpret(model),
    }),
    addresses: t.field({
      description: profileAddressesContainerDescription,
      type: ProfileAddressesRef,
      nullable: true,
      resolve: (model) => model,
    }),
    socials: t.field({
      description: profileSocialsContainerDescription,
      type: ProfileSocialsRef,
      nullable: true,
      resolve: (model) => model,
    }),
  }),
});
