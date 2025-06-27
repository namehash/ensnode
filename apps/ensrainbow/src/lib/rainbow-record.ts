import { Label } from "@ensnode/ensnode-sdk";
import {
  type LabelSetVersion,
  buildLabelSetVersion,
  parseNonNegativeInteger,
} from "@ensnode/ensrainbow-sdk";

/**
 * Represents a decoded versioned rainbow record.
 *
 * It contains the original label and the label set version it belongs to.
 * This is the structured representation of the data stored as a string
 * in the database for each rainbow record.
 */
export interface VersionedRainbowRecord {
  label: Label;
  labelSetVersion: LabelSetVersion;
}

/**
 * A type alias for the string-encoded representation of a VersionedRainbowRecord.
 * Format is "{labelSetVersion}:{label}".
 */
export type EncodedVersionedRainbowRecord = string;

/**
 * Builds an encoded versioned rainbow record string from a label and its set version.
 * Performs validation on the label set version.
 *
 * @param label The label string.
 * @param labelSetVersion The label set version number.
 * @returns The encoded versioned rainbow record string.
 * @throws Error if labelSetVersion is not a non-negative integer.
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
      `Invalid label set version number "${maybeLabelSetVersion}" in encoded versioned rainbow record "${encodedVersionedRainbowRecord}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
