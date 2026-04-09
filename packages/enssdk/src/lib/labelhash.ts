import { isHex, keccak256, stringToBytes } from "viem";
import { labelhash as viemLabelhash } from "viem/ens";

import type { EncodedLabelHash, InterpretedLabel, LabelHash, LiteralLabel } from "./types";

/**
 * Typed wrapper around viem's `labelhash` that returns a branded {@link LabelHash},
 * requiring an {@link InterpretedLabel} input.
 *
 * Note: viem's labelhash has special-case handling for Encoded LabelHashes (e.g. `[hash]`).
 * Use {@link labelhashLiteralLabel} if you need to hash a label's literal bytes without
 * encoded labelhash detection.
 *
 * @see https://docs.ens.domains/ensip/1
 */
export const labelhashInterpretedLabel = (label: InterpretedLabel): LabelHash =>
  viemLabelhash(label);

/**
 * Implements the ENS `labelhash` function for Literal Labels.
 * @see https://docs.ens.domains/ensip/1
 *
 * @param label the Literal Label to hash
 * @returns the hash of the provided label
 * @dev This function is viem/ens#labelhash but without the special-case handling of Encoded LabelHashes.
 */
export const labelhashLiteralLabel = (label: LiteralLabel): LabelHash =>
  keccak256(stringToBytes(label));

/**
 * Checks if the input is a {@link LabelHash}.
 *
 * @see https://ensnode.io/docs/reference/terminology#label-processing-and-classification
 */
export function isLabelHash(maybeLabelHash: string): maybeLabelHash is LabelHash {
  const expectedLength = maybeLabelHash.length === 66;
  const expectedEncoding = isHex(maybeLabelHash);
  const expectedCasing = maybeLabelHash === maybeLabelHash.toLowerCase();

  return expectedLength && expectedEncoding && expectedCasing;
}

/**
 * Formats a LabelHash as an Encoded LabelHash.
 *
 * @see https://ensnode.io/docs/reference/terminology#encoded-labelhash
 *
 * @param labelHash - A 32-byte lowercase hash string starting with '0x'
 * @returns The encoded label hash in format `[hash_without_0x_prefix]`
 */
export const encodeLabelHash = (labelHash: LabelHash): EncodedLabelHash =>
  `[${labelHash.slice(2)}]`;

/**
 * Checks if the value is an {@link EncodedLabelHash}.
 */
export function isEncodedLabelHash(value: string): value is EncodedLabelHash {
  const expectedFormatting = value.startsWith("[") && value.endsWith("]");
  const includesLabelHash = isLabelHash(`0x${value.slice(1, -1)}`);

  return expectedFormatting && includesLabelHash;
}
