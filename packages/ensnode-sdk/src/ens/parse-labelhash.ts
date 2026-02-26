import { isHex } from "viem";

import type { LabelHash } from "./types";

/**
 * Error thrown when a labelHash cannot be normalized.
 */
export class InvalidLabelHashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLabelHashError";
  }
}

/**
 * Parses a labelHash string and normalizes it to a canonical `LabelHash`.
 *
 * Normalization rules applied in order:
 * 1. Adds `0x` prefix if missing
 * 2. Validates all characters (excluding the optional `0x` prefix) are valid hex digits
 *    (uppercase or lowercase A-F are accepted and normalized to lowercase)
 * 3. If the hex digit count is odd, adds a leading `0` to make it even
 * 4. Validates the result is exactly 64 hex digits (32 bytes)
 *
 * @param maybeLabelHash - The string to parse as a labelHash
 * @returns A normalized labelHash (0x-prefixed, lowercased, 64-character hex string)
 * @throws {InvalidLabelHashError} If the input cannot be normalized to a valid labelHash
 */
export function parseLabelHash(maybeLabelHash: string): LabelHash {
  const hexPart = maybeLabelHash.startsWith("0x") ? maybeLabelHash.slice(2) : maybeLabelHash;

  if (!isHex(`0x${hexPart}`, { strict: true })) {
    throw new InvalidLabelHashError(
      `Invalid labelHash: contains non-hex characters: ${maybeLabelHash}`,
    );
  }

  const normalizedHexPart = hexPart.length % 2 === 1 ? `0${hexPart}` : hexPart;

  if (normalizedHexPart.length !== 64) {
    throw new InvalidLabelHashError(
      `Invalid labelHash length: expected 32 bytes (64 hex chars), got ${normalizedHexPart.length / 2} bytes: ${maybeLabelHash}`,
    );
  }

  return `0x${normalizedHexPart.toLowerCase()}` as LabelHash;
}

/**
 * Parses an encoded labelHash string (surrounded by square brackets) and normalizes it.
 *
 * @param maybeEncodedLabelHash - The string to parse as an encoded labelHash
 * @returns A normalized labelHash (0x-prefixed, lowercased, 64-character hex string)
 * @throws {InvalidLabelHashError} If the input is not properly enclosed in brackets or cannot be normalized
 */
export function parseEncodedLabelHash(maybeEncodedLabelHash: string): LabelHash {
  if (!maybeEncodedLabelHash.startsWith("[") || !maybeEncodedLabelHash.endsWith("]")) {
    throw new InvalidLabelHashError(
      `Invalid encoded labelHash: must be enclosed in square brackets: ${maybeEncodedLabelHash}`,
    );
  }

  return parseLabelHash(maybeEncodedLabelHash.slice(1, -1));
}

/**
 * Parses a labelHash or encoded labelHash string and normalizes it.
 *
 * Tries both formats to be maximally generous with accepted inputs:
 * - If the input starts with `[` and ends with `]`, it is treated as an encoded labelHash
 * - Otherwise, it is treated as a plain labelHash
 *
 * @param maybeLabelHash - The string to parse as a labelHash or encoded labelHash
 * @returns A normalized labelHash (0x-prefixed, lowercased, 64-character hex string)
 * @throws {InvalidLabelHashError} If the input cannot be normalized to a valid labelHash
 */
export function parseLabelHashOrEncodedLabelHash(maybeLabelHash: string): LabelHash {
  if (maybeLabelHash.startsWith("[") && maybeLabelHash.endsWith("]")) {
    return parseEncodedLabelHash(maybeLabelHash);
  }

  return parseLabelHash(maybeLabelHash);
}
