import type { EncodedLabelHash, LabelHash } from "./types";

/**
 * Represents a LabelHash as an Encoded LabelHash.
 *
 * @see https://ensnode.io/docs/reference/terminology#encoded-labelhash
 *
 * @param labelHash - A 32-byte hash string starting with '0x'
 * @returns The encoded label hash in format `[hash_without_0x_prefix]`
 * @throws Error if labelHash doesn't start with '0x' or doesn't have length 66
 */
export function encodeLabelHash(labelHash: LabelHash): EncodedLabelHash {
  if (!labelHash.startsWith("0x")) throw new Error("Expected labelhash to start with 0x");
  if (labelHash.length !== 66) throw new Error("Expected labelhash to have a length of 66");

  return `[${labelHash.slice(2)}]`;
}
