import { builder } from "@/omnigraph-api/builder";
import {
  ADDRESS_PARSERS,
  ProfileAvatarParser,
  ProfileDescriptionParser,
  ProfileEmailParser,
  ProfileHeaderParser,
  ProfileWebsiteParser,
  SOCIAL_PARSERS,
} from "@/omnigraph-api/lib/resolution/profile/parsers";
import {
  profileAddressesContainerDescription,
  profileAddressFieldDescription,
  profileImageHttpUrlFieldDescription,
  profileSocialFieldDescription,
  profileSocialsContainerDescription,
  profileWebsiteFieldDescription,
} from "@/omnigraph-api/lib/resolution/profile/profile-descriptions";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

export type ProfileSocialAccountModel = { handle: string; httpUrl: string };
export type ProfileImageModel = { httpUrl: string | null };

export const ProfileSocialAccountRef =
  builder.objectRef<ProfileSocialAccountModel>("ProfileSocialAccount");

ProfileSocialAccountRef.implement({
  description:
    "An interpreted social account. Only returned when the raw record was successfully parsed; otherwise the parent social field is null.",
  fields: (t) => ({
    handle: t.exposeString("handle", {
      description: "The normalized social handle extracted from the raw record.",
      nullable: false,
    }),
    httpUrl: t.exposeString("httpUrl", {
      description: "The canonical HTTP-compatible social profile URL.",
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
      resolve: (model) => SOCIAL_PARSERS.github.parse(model),
    }),
    telegram: t.field({
      description: profileSocialFieldDescription("Telegram"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.telegram.parse(model),
    }),
    twitter: t.field({
      description: profileSocialFieldDescription("X (Twitter)"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.twitter.parse(model),
    }),
    linkedin: t.field({
      description: profileSocialFieldDescription("LinkedIn"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.linkedin.parse(model),
    }),
    keybase: t.field({
      description: profileSocialFieldDescription("Keybase"),
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.keybase.parse(model),
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
      resolve: (model) => ADDRESS_PARSERS.ethereum.parse(model),
    }),
    base: t.field({
      description: profileAddressFieldDescription("Base"),
      type: "Address",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.base.parse(model),
    }),
    bitcoin: t.field({
      description: profileAddressFieldDescription("Bitcoin"),
      type: "BitcoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.bitcoin.parse(model),
    }),
    solana: t.field({
      description: profileAddressFieldDescription("Solana"),
      type: "SolanaAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.solana.parse(model),
    }),
    litecoin: t.field({
      description: profileAddressFieldDescription("Litecoin"),
      type: "LitecoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.litecoin.parse(model),
    }),
    dogecoin: t.field({
      description: profileAddressFieldDescription("Dogecoin"),
      type: "DogecoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.dogecoin.parse(model),
    }),
    monacoin: t.field({
      description: profileAddressFieldDescription("Monacoin"),
      type: "MonacoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.monacoin.parse(model),
    }),
    rootstock: t.field({
      description: profileAddressFieldDescription("Rootstock (RBTC)"),
      type: "RootstockAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.rootstock.parse(model),
    }),
    ripple: t.field({
      description: profileAddressFieldDescription("Ripple (XRP)"),
      type: "RippleAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.ripple.parse(model),
    }),
    bitcoincash: t.field({
      description: profileAddressFieldDescription("Bitcoin Cash"),
      type: "BitcoinCashAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.bitcoincash.parse(model),
    }),
    binance: t.field({
      description: profileAddressFieldDescription("Binance Chain (BNB)"),
      type: "BinanceAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.binance.parse(model),
    }),
  }),
});

export const ProfileAvatarRef = builder.objectRef<ProfileImageModel>("ProfileAvatar");

ProfileAvatarRef.implement({
  description: "Interpreted avatar metadata on a Name profile.",
  fields: (t) => ({
    httpUrl: t.exposeString("httpUrl", {
      description: profileImageHttpUrlFieldDescription("avatar"),
      nullable: true,
    }),
  }),
});

export const ProfileHeaderRef = builder.objectRef<ProfileImageModel>("ProfileHeader");

ProfileHeaderRef.implement({
  description: "Interpreted header metadata on a Name profile.",
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
      resolve: (model) => ProfileWebsiteParser.parse(model),
    }),
  }),
});

export const DomainProfileRef = builder.objectRef<ResolvedRecordsModel>("DomainProfile");

DomainProfileRef.implement({
  description:
    "An interpreted profile for a name. Individual fields return null when their raw record is unset or cannot be interpreted; see each field's description for validation rules.",
  fields: (t) => ({
    avatar: t.field({
      description:
        "Interpreted avatar metadata. Returns null when the raw avatar record is unset or empty.",
      type: ProfileAvatarRef,
      nullable: true,
      resolve: (model) => ProfileAvatarParser.parse(model),
    }),
    header: t.field({
      description:
        "Interpreted header metadata. Returns null when the raw header record is unset or empty.",
      type: ProfileHeaderRef,
      nullable: true,
      resolve: (model) => ProfileHeaderParser.parse(model),
    }),
    website: t.field({
      description: profileWebsiteFieldDescription,
      type: ProfileWebsiteRef,
      nullable: true,
      resolve: (model) => (ProfileWebsiteParser.parse(model) ? model : null),
    }),
    description: t.string({
      description:
        "The profile description. Returns null when the raw record is unset or empty. Non-empty values are returned as-is without format validation.",
      nullable: true,
      resolve: (model) => ProfileDescriptionParser.parse(model),
    }),
    email: t.field({
      description:
        "The contact email address. Returns null when the raw record is unset, empty, or fails email validation.",
      type: "Email",
      nullable: true,
      resolve: (model) => ProfileEmailParser.parse(model),
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
