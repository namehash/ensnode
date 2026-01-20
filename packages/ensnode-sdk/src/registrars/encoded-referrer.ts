import { type Address, getAddress, type Hex, pad, size, slice, zeroAddress } from "viem";

/**
 * Encoded Referrer
 *
 * Represents a "raw" ENS referrer value.
 *
 * Registrar controllers emit referrer data as bytes32 values. This type represents
 * that raw 32-byte hex string.
 *
 * @invariant Guaranteed to be a hex string representation of a 32-byte value.
 */
export type EncodedReferrer = Hex;

/**
 * Encoded Referrer byte offset
 *
 * The count of left-padded bytes in an {@link EncodedReferrer} value.
 */
export const ENCODED_REFERRER_BYTE_OFFSET = 12;

/**
 * Encoded Referrer byte length
 *
 * The count of bytes the {@link EncodedReferrer} value consists of.
 */
export const ENCODED_REFERRER_BYTE_LENGTH = 32;

/**
 * Expected padding for a valid encoded referrer
 *
 * Properly encoded referrers must have exactly 12 zero bytes of left padding
 * before the 20-byte Ethereum address.
 */
export const EXPECTED_ENCODED_REFERRER_PADDING: Hex = pad("0x", {
  size: ENCODED_REFERRER_BYTE_OFFSET,
  dir: "left",
});

/**
 * Zero Encoded Referrer
 *
 * Guaranteed to be a hex string representation of a 32-byte zero value.
 */
export const ZERO_ENCODED_REFERRER: EncodedReferrer = pad("0x", {
  size: ENCODED_REFERRER_BYTE_LENGTH,
  dir: "left",
});

/**
 * Build an {@link EncodedReferrer} value for the given {@link Address}
 * according to the referrer encoding with left-zero-padding.
 */
export function buildEncodedReferrer(address: Address): EncodedReferrer {
  const lowercaseAddress = address.toLowerCase() as Address;

  return pad(lowercaseAddress, { size: ENCODED_REFERRER_BYTE_LENGTH, dir: "left" });
}

/**
 * Decode an {@link EncodedReferrer} value into a checksummed {@link Address}
 * according to the referrer encoding with left-zero-padding.
 *
 * @param encodedReferrer - The "raw" {@link EncodedReferrer} value to decode.
 * @returns The decoded referrer checksummed address.
 * @throws when encodedReferrer value is not represented by
 *         {@link ENCODED_REFERRER_BYTE_LENGTH} bytes.
 * @throws when decodedReferrer is not a valid EVM address.
 */
export function decodeEncodedReferrer(encodedReferrer: EncodedReferrer): Address {
  // Invariant: encoded referrer must be of expected size
  if (size(encodedReferrer) !== ENCODED_REFERRER_BYTE_LENGTH) {
    throw new Error(
      `Encoded referrer value must be represented by ${ENCODED_REFERRER_BYTE_LENGTH} bytes.`,
    );
  }

  const padding = slice(encodedReferrer, 0, ENCODED_REFERRER_BYTE_OFFSET);

  // strict validation: padding must be all zeros
  // if any byte in the padding is non-zero, treat as Zero Encoded Referrer
  if (padding !== EXPECTED_ENCODED_REFERRER_PADDING) {
    return zeroAddress;
  }

  const decodedReferrer = slice(encodedReferrer, ENCODED_REFERRER_BYTE_OFFSET);

  try {
    // return checksummed address
    return getAddress(decodedReferrer);
  } catch {
    throw new Error(`Decoded referrer value must be a valid EVM address.`);
  }
}
