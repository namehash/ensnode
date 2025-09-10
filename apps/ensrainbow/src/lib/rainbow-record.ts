import { getErrorMessage } from "@/utils/error-utils";
import { Label } from "@ensnode/ensnode-sdk";
import { type LabelSetVersion, buildLabelSetVersion } from "@ensnode/ensnode-sdk";

/**
 * A versioned rainbow record.
 */
export interface VersionedRainbowRecord {
  /** The original label string */
  label: Label;
  /** The label set version this record belongs to */
  labelSetVersion: LabelSetVersion;
}

/**
 * A type alias for the string-encoded representation of a VersionedRainbowRecord.
 * Format is "{labelSetVersion}:{label}".
 */
export type EncodedVersionedRainbowRecord = string;

/**
 * Builds an encoded versioned rainbow record string from a label and its set version.
 *
 * @param label The label string.
 * @param labelSetVersion The label set version number.
 * @returns The encoded versioned rainbow record string.
 */
export function buildEncodedVersionedRainbowRecord(
  label: string,
  labelSetVersion: LabelSetVersion,
): EncodedVersionedRainbowRecord {
  return `${labelSetVersion}:${label}`;
}

/**
 * Decodes an encoded versioned rainbow record string into its components.
 * Format of input is expected to be "{labelSetVersion}:{label}"
 *
 * @param encodedVersionedRainbowRecord The encoded versioned rainbow record string.
 * @returns A VersionedRainbowRecord object.
 * @throws Error if the format is invalid or the label set version is not a valid number.
 */
export function decodeEncodedVersionedRainbowRecord(
  encodedVersionedRainbowRecord: EncodedVersionedRainbowRecord,
): VersionedRainbowRecord {
  const colonIndex = encodedVersionedRainbowRecord.indexOf(":");
  if (colonIndex <= 0) {
    throw new Error(
      `Invalid encoded versioned rainbow record format (missing label set version prefix): "${encodedVersionedRainbowRecord}"`,
    );
  }

  const maybeLabelSetVersion = encodedVersionedRainbowRecord.substring(0, colonIndex);
  const label = encodedVersionedRainbowRecord.substring(colonIndex + 1);

  try {
    const labelSetVersion = buildLabelSetVersion(maybeLabelSetVersion);
    return { labelSetVersion, label };
  } catch (error: unknown) {
    throw new Error(
      `Invalid label set version number "${maybeLabelSetVersion}" in encoded versioned rainbow record "${encodedVersionedRainbowRecord}": ${getErrorMessage(error)}`,
    );
  }
}
