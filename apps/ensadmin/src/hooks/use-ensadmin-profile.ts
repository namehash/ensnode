"use client";

import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useProfile } from "@ensnode/ensnode-react";
import type { Name, ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import { getCommonCoinTypes } from "@ensnode/ensnode-sdk";
import { useMemo } from "react";

/**
 * Strongly-typed social link identifiers supported by ENSAdmin profiles.
 */
export const ENSADMIN_SOCIAL_LINK_KEYS = [
  "com.twitter",
  "com.github",
  "com.farcaster",
  "org.telegram",
  "com.linkedin",
  "com.reddit",
] as const;

/**
 * A social link key recognized by ENSAdmin.
 */
export type ENSAdminSocialLinkKey = (typeof ENSADMIN_SOCIAL_LINK_KEYS)[number];

/**
 * A structured social link with its platform identifier and username/handle value.
 */
export type ENSAdminSocialLink = {
  readonly key: ENSAdminSocialLinkKey;
  readonly value: string;
};

/**
 * A structured address record with its coin type identifier and address value.
 */
export type ENSAdminAddressRecord = {
  readonly coinType: string;
  readonly address: string;
};

/**
 * A structured additional text record with its key and value.
 * Excludes records already displayed in header, profile, or social sections.
 */
export type ENSAdminAdditionalTextRecord = {
  readonly key: string;
  readonly value: string;
};

/**
 * The specialized ENS Profile data model optimized for ENSAdmin.
 *
 * This model abstracts away the complexities of raw `useRecords` responses
 * and provides a clean, purpose-built structure for ENSAdmin's profile UI.
 *
 * @example
 * ```typescript
 * const profile: ENSAdminProfile = {
 *   name: "vitalik.eth",
 *   header: {
 *     avatarUrl: "https://...",
 *     headerImageUrl: "https://...",
 *     websiteUrl: "https://vitalik.ca",
 *   },
 *   information: {
 *     description: "Ethereum co-founder",
 *     email: "v@ethereum.org",
 *   },
 *   socialLinks: [
 *     { key: "com.twitter", value: "VitalikButerin" },
 *   ],
 *   addresses: [
 *     { coinType: "60", address: "0x..." },
 *   ],
 *   additionalTextRecords: [
 *     { key: "status", value: "Building" },
 *   ],
 * };
 * ```
 */
export type ENSAdminProfile = {
  /**
   * The ENS name being displayed.
   */
  readonly name: Name;

  /**
   * Header section data including avatar, banner image, and website URL.
   */
  readonly header: {
    readonly avatarUrl: string | null;
    readonly headerImageUrl: string | null;
    readonly websiteUrl: string | null;
  };

  /**
   * Profile information section data.
   */
  readonly information: {
    readonly description: string | null;
    readonly email: string | null;
  };

  /**
   * Structured list of social platform links with non-null values.
   */
  readonly socialLinks: readonly ENSAdminSocialLink[];

  /**
   * Structured list of blockchain addresses with non-null values.
   */
  readonly addresses: readonly ENSAdminAddressRecord[];

  /**
   * Additional text records not displayed elsewhere, with non-null values.
   */
  readonly additionalTextRecords: readonly ENSAdminAdditionalTextRecord[];
};

/**
 * Text record keys that are displayed in specialized UI sections.
 * Used to filter out these keys from the additional records section.
 */
const DISPLAYED_TEXT_RECORD_KEYS = [
  "url",
  "avatar",
  "header",
  "description",
  "email",
  "name",
  ...ENSADMIN_SOCIAL_LINK_KEYS,
] as const;

/**
 * Parameters for the useENSAdminProfile hook.
 */
export type UseENSAdminProfileParameters = {
  /**
   * The ENS name to resolve profile data for.
   */
  name: Name;
};

/**
 * Hook for fetching and transforming ENS profile data optimized for ENSAdmin.
 *
 * Internally calls `useProfile` with ENSAdmin-specific record selection and
 * transformation logic to produce a clean, structured `ENSAdminProfile` data
 * model tailored for ENSAdmin's UI components.
 *
 * @param parameters - Configuration specifying which name to resolve
 * @returns Query result containing the transformed ENSAdminProfile data model
 *
 * @example
 * ```typescript
 * import { useENSAdminProfile } from "@/hooks/use-ensadmin-profile";
 *
 * function ProfilePage() {
 *   const { data: profile, status } = useENSAdminProfile({
 *     name: "vitalik.eth"
 *   });
 *
 *   if (status === "pending") return <ProfileSkeleton />;
 *   if (status === "error") return <ErrorDisplay />;
 *
 *   return (
 *     <>
 *       <ProfileHeader profile={profile} />
 *       <ProfileInformation profile={profile} />
 *       <SocialLinks profile={profile} />
 *       <Addresses profile={profile} />
 *       <AdditionalRecords profile={profile} />
 *     </>
 *   );
 * }
 * ```
 */
export function useENSAdminProfile({ name }: UseENSAdminProfileParameters) {
  const activeNamespace = useActiveNamespace();

  const recordsSelection = useMemo(
    () =>
      ({
        addresses: getCommonCoinTypes(activeNamespace),
        texts: [
          // Header section texts
          "url",
          "avatar",
          "header",
          // Profile information section texts
          "description",
          "email",
          // Social links
          ...ENSADMIN_SOCIAL_LINK_KEYS,
          // Additional known records
          // TODO: Extend to dynamically discover all text records set onchain
          // See: https://github.com/namehash/ensnode/issues/1083
          "status",
          "eth.ens.delegate",
        ],
      }) as const satisfies ResolverRecordsSelection,
    [activeNamespace],
  );

  const transformRecordsToENSAdminProfile = useMemo(
    () =>
      (
        profileName: Name,
        recordsResponse: {
          records: {
            texts: Record<string, string | null | undefined>;
            addresses: Record<string, string | null | undefined>;
          };
        },
      ): ENSAdminProfile => {
        // Extract and structure social links with non-null values
        const socialLinksWithValues = ENSADMIN_SOCIAL_LINK_KEYS.map((socialLinkKey) => ({
          key: socialLinkKey,
          value: recordsResponse.records.texts[socialLinkKey],
        })).filter(
          (socialLink): socialLink is ENSAdminSocialLink =>
            socialLink.value !== null && socialLink.value !== undefined,
        );

        // Extract and structure addresses with non-null values
        const addressesWithValues = Object.entries(recordsResponse.records.addresses)
          .map(([coinTypeString, addressValue]) => ({
            coinType: coinTypeString,
            address: addressValue as string,
          }))
          .filter(
            (addressRecord): addressRecord is ENSAdminAddressRecord =>
              addressRecord.address !== null && addressRecord.address !== undefined,
          );

        // Extract additional text records not displayed elsewhere
        const additionalTextRecordsWithValues = Object.entries(recordsResponse.records.texts)
          .filter(([textKey]) => !DISPLAYED_TEXT_RECORD_KEYS.includes(textKey as any))
          .map(([textKey, textValue]) => ({
            key: textKey,
            value: textValue as string,
          }))
          .filter(
            (textRecord): textRecord is ENSAdminAdditionalTextRecord =>
              textRecord.value !== null && textRecord.value !== undefined,
          );

        return {
          name: profileName,
          header: {
            avatarUrl: recordsResponse.records.texts.avatar ?? null,
            headerImageUrl: recordsResponse.records.texts.header ?? null,
            websiteUrl: recordsResponse.records.texts.url ?? null,
          },
          information: {
            description: recordsResponse.records.texts.description ?? null,
            email: recordsResponse.records.texts.email ?? null,
          },
          socialLinks: socialLinksWithValues,
          addresses: addressesWithValues,
          additionalTextRecords: additionalTextRecordsWithValues,
        };
      },
    [],
  );

  return useProfile(
    {
      name,
      selection: recordsSelection,
    },
    transformRecordsToENSAdminProfile,
  );
}
