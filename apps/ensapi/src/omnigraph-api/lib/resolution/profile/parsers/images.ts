import { type EnsMetadataImageRecord, getEnsMetadataServiceImageUrl } from "enssdk";

import di from "@/di";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

import type { ProfileFieldParser } from "./types";

export type ProfileImageResult = {
  httpUrl: string | null;
};

function parseDirectImageHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  try {
    return new URL(trimmed).href;
  } catch {
    return null;
  }
}

const buildImageParser = (
  record: EnsMetadataImageRecord,
): ProfileFieldParser<ProfileImageResult> => ({
  selection: { texts: [record] },
  parse: (records) => {
    const raw = records.texts?.[record];
    if (raw == null || raw === "") return null;

    const httpUrl =
      parseDirectImageHttpUrl(raw) ?? interpretProfileImageHttpUrl(records, raw, record);

    return { httpUrl };
  },
});

export const ProfileAvatarParser: ProfileFieldParser<ProfileImageResult> =
  buildImageParser("avatar");
export const ProfileHeaderParser: ProfileFieldParser<ProfileImageResult> =
  buildImageParser("header");

/**
 * Derives an HTTP-compatible profile image URL from a resolved records model.
 *
 * Returns null when the raw record is unset or the ENS Metadata Service is unavailable for the
 * current namespace.
 */
function interpretProfileImageHttpUrl(
  model: ResolvedRecordsModel,
  rawValue: string | null | undefined,
  record: EnsMetadataImageRecord,
): string | null {
  if (!rawValue) return null;

  return getEnsMetadataServiceImageUrl(model.id, di.context.namespace, record)?.href ?? null;
}

export const profileImageHttpUrlDescription = (recordLabel: "avatar" | "header") =>
  `Provides a HTTP-compatible URL for fetching the ${recordLabel} image that can be safely referenced as an image in web browsers. ` +
  `This is an abstraction over the "raw" ${recordLabel} record, which may reference non-HTTP compatible URLs or encodings including IPFS urls, CAIP-22 / CAIP-29 NFT References, and more edge cases that cannot be trivially referenced as an image in most web browsers. ` +
  "Additional details here: https://docs.ens.domains/ensip/12";
