import { isLabelHash } from "./labelhash";
import type { EncodedLabelHash, LabelHash } from "./types";

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
 * Checks if the input value is an {@link EncodedLabelHash}.
 */
export function isEncodedLabelHash(
  maybeEncodedLabelHash: string,
): maybeEncodedLabelHash is EncodedLabelHash {
  const expectedFormatting =
    maybeEncodedLabelHash.startsWith("[") && maybeEncodedLabelHash.endsWith("]");
  const includesLabelHash = isLabelHash(`0x${maybeEncodedLabelHash.slice(1, -1)}`);

  return expectedFormatting && includesLabelHash;
}
