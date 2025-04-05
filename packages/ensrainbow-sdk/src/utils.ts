import type { Labelhash } from "@ensnode/utils/types";
import { Hex } from "viem";
import { isHex } from "viem/utils";

export type EncodedLabelhash = `[${string}]`;

/**
 * Error thrown when a labelhash cannot be normalized.
 */
export class InvalidLabelhashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLabelhashError";
  }
}

/**
 * Parses a labelhash string and normalizes it to the format expected by the ENSRainbow API.
 * If the input labelhash is 63 characters long, a leading zero will be added to make it 64 characters.
 *
 * @param maybeLabelhash - The string to parse as a labelhash
 * @returns A normalized labelhash (a 0x-prefixed, lowercased, 64-character hex string)
 * @throws {InvalidLabelhashError} If the input cannot be normalized to a valid labelhash
 */
export function parseLabelhash(maybeLabelhash: string): Labelhash {
  // Remove 0x prefix if present
  let hexPart = maybeLabelhash.startsWith("0x") ? maybeLabelhash.slice(2) : maybeLabelhash;

  // Check if the correct number of bytes (32 bytes = 64 hex chars)
  // If length is 63, pad with a leading zero to make it 64
  if (hexPart.length == 63) {
    hexPart = `0${hexPart}`;
  } else if (hexPart.length !== 64) {
    throw new InvalidLabelhashError(
      `Invalid labelhash length: expected 32 bytes (64 hex chars), got ${hexPart.length / 2} bytes: ${maybeLabelhash}`,
    );
  }
  const normalizedHex: Hex = `0x${hexPart}`;

  // Check if all characters are valid hex digits
  if (!isHex(normalizedHex, { strict: true })) {
    throw new InvalidLabelhashError(
      `Invalid labelhash: contains non-hex characters: ${maybeLabelhash}`,
    );
  }

  // Ensure lowercase
  return normalizedHex.toLowerCase() as Labelhash;
}

/**
 * Parses an encoded labelhash string (surrounded by square brackets) and normalizes it.
 *
 * @param maybeEncodedLabelhash - The string to parse as an encoded labelhash
 * @returns A normalized labelhash (a 0x-prefixed, lowercased, 64-character hex string)
 * @throws {InvalidLabelhashError} If the input is not properly encoded or cannot be normalized
 */
export function parseEncodedLabelhash(maybeEncodedLabelhash: EncodedLabelhash): Labelhash {
  // Check if the string is enclosed in square brackets
  if (!maybeEncodedLabelhash.startsWith("[") || !maybeEncodedLabelhash.endsWith("]")) {
    throw new InvalidLabelhashError(
      `Invalid encoded labelhash: must be enclosed in square brackets: ${maybeEncodedLabelhash}`,
    );
  }

  // Remove the square brackets and parse as a regular labelhash
  const innerValue = maybeEncodedLabelhash.slice(1, -1);
  return parseLabelhash(innerValue);
}

/**
 * Parses a labelhash or encoded labelhash string and normalizes it to the format expected by the ENSRainbow API.
 *
 * @param maybeLabelhash - The string to parse as a labelhash
 * @returns A normalized labelhash (a 0x-prefixed, lowercased, 64-character hex string)
 * @throws {InvalidLabelhashError} If the input cannot be normalized to a valid labelhash
 */
export function parseLabelhashOrEncodedLabelhash(maybeLabelhash: string): Labelhash {
  if (maybeLabelhash.startsWith("[") && maybeLabelhash.endsWith("]")) {
    return parseEncodedLabelhash(maybeLabelhash as EncodedLabelhash);
  } else {
    return parseLabelhash(maybeLabelhash);
  }
}
