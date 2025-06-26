import { parseNonNegativeInteger } from "@/utils/parsing";
import { Label } from "@ensnode/ensnode-sdk";

/**
 * Represents a decoded rainbow record value.
 *
 * It contains the original label and the label set version it belongs to.
 * This is the structured representation of the data stored as a string
 * in the database for each rainbow record.
 */
export interface RainbowRecordValue {
  label: Label;
  labelSetVersion: number;
}

/**
 * A type alias for the string-encoded representation of a RainbowRecordValue.
 * Format is "{labelSetVersion}:{label}".
 */
export type EncodedRainbowRecordValue = string;

/**
 * Builds an encoded rainbow record value string from a label and its set version.
 * Performs validation on the label set version.
 *
 * @param label The label string.
 * @param labelSetVersion The label set version number.
 * @returns The encoded rainbow record value string.
 * @throws Error if labelSetVersion is not a non-negative integer.
 */
export function buildEncodedRainbowRecordValue(
  label: string,
  labelSetVersion: number,
): EncodedRainbowRecordValue {
  if (!Number.isInteger(labelSetVersion) || labelSetVersion < 0) {
    throw new Error(
      `Invalid label set version: ${labelSetVersion} (must be a non-negative integer)`,
    );
  }
  return `${labelSetVersion}:${label}`;
}

/**
 * Decodes an encoded rainbow record value string into its components.
 * Format of input is expected to be "{labelSetVersion}:{label}"
 *
 * @param encodedRainbowRecordValue The encoded rainbow record value string.
 * @returns A RainbowRecordValue object.
 * @throws Error if the format is invalid or the label set version is not a valid number.
 */
export function decodeEncodedRainbowRecordValue(
  encodedRainbowRecordValue: EncodedRainbowRecordValue,
): RainbowRecordValue {
  const colonIndex = encodedRainbowRecordValue.indexOf(":");
  if (colonIndex <= 0) {
    throw new Error(
      `Invalid encoded rainbow record value format (missing label set version prefix): "${encodedRainbowRecordValue}"`,
    );
  }

  const labelSetVersionStr = encodedRainbowRecordValue.substring(0, colonIndex);
  const label = encodedRainbowRecordValue.substring(colonIndex + 1);

  try {
    const labelSetVersion = parseNonNegativeInteger(labelSetVersionStr);
    return { labelSetVersion, label };
  } catch (error: unknown) {
    throw new Error(
      `Invalid label set version number "${labelSetVersionStr}" in encoded value "${encodedRainbowRecordValue}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
