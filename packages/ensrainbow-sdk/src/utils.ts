import type { Labelhash } from "@ensnode/utils/types";

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
 *
 * @param maybeLabelhash - The string to parse as a labelhash
 * @returns A normalized labelhash (Hex string)
 * @throws {InvalidLabelhashError} If the input cannot be normalized to a valid labelhash
 */
export function parseLabelhash(maybeLabelhash: string): Labelhash {
  // Add 0x prefix if missing
  let normalized = maybeLabelhash.startsWith("0x") ? maybeLabelhash : `0x${maybeLabelhash}`;

  // Remove 0x prefix for validation, will add back later
  const hexPart = normalized.slice(2);

  // Check if all characters are valid hex digits
  if (!/^[0-9a-fA-F]*$/.test(hexPart)) {
    throw new InvalidLabelhashError(
      `Invalid labelhash: contains non-hex characters: ${maybeLabelhash}`,
    );
  }

  // If odd number of hex digits, add a leading 0
  const normalizedHexPart = hexPart.length % 2 === 1 ? `0${hexPart}` : hexPart;

  // Check if the correct number of bytes (32 bytes = 64 hex chars)
  if (normalizedHexPart.length !== 64) {
    throw new InvalidLabelhashError(
      `Invalid labelhash length: expected 32 bytes (64 hex chars), got ${normalizedHexPart.length / 2} bytes: ${maybeLabelhash}`,
    );
  }

  // Ensure lowercase
  return `0x${normalizedHexPart.toLowerCase()}` as Labelhash;
}

/**
 * Parses an encoded labelhash string (surrounded by square brackets) and normalizes it.
 *
 * @param maybeEncodedLabelhash - The string to parse as an encoded labelhash
 * @returns A normalized labelhash (Hex string)
 * @throws {InvalidLabelhashError} If the input is not properly encoded or cannot be normalized
 */
export function parseEncodedLabelhash(maybeEncodedLabelhash: string): Labelhash {
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
