import { builder } from "@/omnigraph-api/builder";
import {
  ADDRESS_PARSERS,
  ProfileAvatarParser,
  ProfileDescriptionParser,
  ProfileEmailParser,
  ProfileHeaderParser,
  ProfileWebsiteParser,
  profileImageHttpUrlDescription,
  SOCIAL_PARSERS,
} from "@/omnigraph-api/lib/resolution/profile/parsers";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

export type ProfileSocialAccountModel = { handle: string; httpUrl: string };
export type ProfileImageModel = { httpUrl: string | null };

export const ProfileSocialAccountRef =
  builder.objectRef<ProfileSocialAccountModel>("ProfileSocialAccount");

ProfileSocialAccountRef.implement({
  description: "An interpreted social account on a Domain profile.",
  fields: (t) => ({
    handle: t.exposeString("handle", {
      description: "The social handle.",
      nullable: false,
    }),
    httpUrl: t.exposeString("httpUrl", {
      description: "The HTTP-compatible social profile URL.",
      nullable: false,
    }),
  }),
});

export const ProfileSocialsRef = builder.objectRef<ResolvedRecordsModel>("ProfileSocials");

ProfileSocialsRef.implement({
  description: "Interpreted social accounts on a Domain profile.",
  fields: (t) => ({
    github: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.github.parse(model),
    }),
    telegram: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.telegram.parse(model),
    }),
    twitter: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.twitter.parse(model),
    }),
    linkedin: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.linkedin.parse(model),
    }),
    keybase: t.field({
      type: ProfileSocialAccountRef,
      nullable: true,
      resolve: (model) => SOCIAL_PARSERS.keybase.parse(model),
    }),
  }),
});

export const ProfileAddressesRef = builder.objectRef<ResolvedRecordsModel>("ProfileAddresses");

ProfileAddressesRef.implement({
  description: "Interpreted address records on a Domain profile.",
  fields: (t) => ({
    ethereum: t.field({
      description: "The interpreted Ethereum address, or null when unset.",
      type: "Address",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.ethereum.parse(model),
    }),
    base: t.field({
      description: "The interpreted Base address, or null when unset.",
      type: "Address",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.base.parse(model),
    }),
    bitcoin: t.field({
      description: "The interpreted Bitcoin address, or null when unset.",
      type: "BitcoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.bitcoin.parse(model),
    }),
    solana: t.field({
      description: "The interpreted Solana address, or null when unset.",
      type: "SolanaAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.solana.parse(model),
    }),
    litecoin: t.field({
      description: "The interpreted Litecoin address, or null when unset.",
      type: "LitecoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.litecoin.parse(model),
    }),
    dogecoin: t.field({
      description: "The interpreted Dogecoin address, or null when unset.",
      type: "DogecoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.dogecoin.parse(model),
    }),
    monacoin: t.field({
      description: "The interpreted Monacoin address, or null when unset.",
      type: "MonacoinAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.monacoin.parse(model),
    }),
    rootstock: t.field({
      description: "The interpreted Rootstock (RBTC) address, or null when unset.",
      type: "RootstockAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.rootstock.parse(model),
    }),
    ripple: t.field({
      description: "The interpreted Ripple (XRP) address, or null when unset.",
      type: "RippleAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.ripple.parse(model),
    }),
    bitcoincash: t.field({
      description: "The interpreted Bitcoin Cash address, or null when unset.",
      type: "BitcoinCashAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.bitcoincash.parse(model),
    }),
    binance: t.field({
      description: "The interpreted Binance Chain (BNB) address, or null when unset.",
      type: "BinanceAddress",
      nullable: true,
      resolve: (model) => ADDRESS_PARSERS.binance.parse(model),
    }),
  }),
});

export const ProfileAvatarRef = builder.objectRef<ProfileImageModel>("ProfileAvatar");

ProfileAvatarRef.implement({
  description: "Interpreted avatar metadata on a Domain profile.",
  fields: (t) => ({
    httpUrl: t.exposeString("httpUrl", {
      description: profileImageHttpUrlDescription("avatar"),
      nullable: true,
    }),
  }),
});

export const ProfileHeaderRef = builder.objectRef<ProfileImageModel>("ProfileHeader");

ProfileHeaderRef.implement({
  description: "Interpreted header metadata on a Domain profile.",
  fields: (t) => ({
    httpUrl: t.exposeString("httpUrl", {
      description: profileImageHttpUrlDescription("header"),
      nullable: true,
    }),
  }),
});

export const ProfileWebsiteRef = builder.objectRef<ResolvedRecordsModel>("ProfileWebsite");

ProfileWebsiteRef.implement({
  description: "Interpreted website metadata on a Domain profile.",
  fields: (t) => ({
    httpUrl: t.string({
      description: "The HTTP-compatible website URL, or null when unset.",
      nullable: true,
      resolve: (model) => ProfileWebsiteParser.parse(model),
    }),
  }),
});

export const DomainProfileRef = builder.objectRef<ResolvedRecordsModel>("DomainProfile");

DomainProfileRef.implement({
  description: "An interpreted ENS profile for a name.",
  fields: (t) => ({
    avatar: t.field({
      type: ProfileAvatarRef,
      nullable: true,
      resolve: (model) => ProfileAvatarParser.parse(model),
    }),
    header: t.field({
      type: ProfileHeaderRef,
      nullable: true,
      resolve: (model) => ProfileHeaderParser.parse(model),
    }),
    website: t.field({
      type: ProfileWebsiteRef,
      nullable: true,
      resolve: (model) => (ProfileWebsiteParser.parse(model) ? model : null),
    }),
    description: t.string({
      description: "The profile description, or null when unset.",
      nullable: true,
      resolve: (model) => ProfileDescriptionParser.parse(model),
    }),
    email: t.field({
      description: "The contact email address, or null when unset or invalid.",
      type: "Email",
      nullable: true,
      resolve: (model) => ProfileEmailParser.parse(model),
    }),
    addresses: t.field({
      type: ProfileAddressesRef,
      nullable: true,
      resolve: (model) => model,
    }),
    socials: t.field({
      type: ProfileSocialsRef,
      nullable: true,
      resolve: (model) => model,
    }),
  }),
});
