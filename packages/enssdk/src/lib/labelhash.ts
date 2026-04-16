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
 * @returns The encoded label hash in format `[labelhash_without_0x_prefix]`
 */
export const encodeLabelHash = (labelHash: LabelHash): EncodedLabelHash =>
  `[${labelHash.slice(2)}]`;

/**
 * Parses an Encoded LabelHash (`[labelhash_without_0x_prefix]`) as a {@link LabelHash},
 * returning `null` if the input does not match the expected format.
 */
function parseEncodedLabelHash(value: string): LabelHash | null {
  if (value.length !== 66) return null;
  if (value[0] !== "[") return null;
  if (value[65] !== "]") return null;

  const hash = `0x${value.slice(1, 65)}`;
  if (!isLabelHash(hash)) return null;

  return hash;
}

/**
 * Decodes an Encoded LabelHash as a LabelHash.
 *
 * @throws if a valid LabelHash cannot be decoded
 *
 * @see https://ensnode.io/docs/reference/terminology#encoded-labelhash
 * @see https://github.com/wevm/viem/blob/main/src/utils/ens/encodedLabelToLabelhash.ts
 *
 * @param maybeEncodedLabelHash The encoded label hash in format `[labelhash_without_0x_prefix]`
 * @returns A 32-byte lowercase hash string starting with '0x'
 */
export const decodeEncodedLabelHash = (maybeEncodedLabelHash: string): LabelHash => {
  const parsed = parseEncodedLabelHash(maybeEncodedLabelHash);
  if (parsed === null) {
    throw new Error(
      `EncodedLabelHash '${maybeEncodedLabelHash}' is malformed: expected format '[<64-char lowercase hex>]'.`,
    );
  }
  return parsed;
};

/**
 * Checks if the value is an {@link EncodedLabelHash}.
 */
export function isEncodedLabelHash(value: string): value is EncodedLabelHash {
  return parseEncodedLabelHash(value) !== null;
}
