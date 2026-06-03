import { type EnsMetadataImageRecord, getEnsMetadataServiceImageUrl } from "enssdk";

import di from "@/di";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

import type { ProfileFieldInterpreter } from "./types";

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

const buildImageInterpreter = (
  record: EnsMetadataImageRecord,
): ProfileFieldInterpreter<ProfileImageResult> => ({
  selection: { texts: [record] },
  interpret: (result) => {
    const raw = result.records.texts?.[record]?.trim();
    if (!raw) return null;

    const httpUrl =
      parseDirectImageHttpUrl(raw) ?? interpretProfileImageHttpUrl(result, raw, record);

    return { httpUrl };
  },
});

export const ProfileAvatarInterpreter: ProfileFieldInterpreter<ProfileImageResult> =
  buildImageInterpreter("avatar");
export const ProfileHeaderInterpreter: ProfileFieldInterpreter<ProfileImageResult> =
  buildImageInterpreter("header");

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

  return getEnsMetadataServiceImageUrl(model.name, di.context.namespace, record)?.href ?? null;
}
