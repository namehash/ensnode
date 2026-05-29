import { builder } from "@/omnigraph-api/builder";

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
