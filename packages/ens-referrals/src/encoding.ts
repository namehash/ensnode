import { type Address, getAddress, type Hex, pad, size, slice, zeroAddress } from "viem";

/**
 * Encoded Referrer
 *
 * Represents a "raw" ENS referrer value.
 *
 * Guaranteed to be a hex string representation of a 32-byte value.
 * For ENS Holiday Awards a correctly encoded referrer is
 * a left-padded lowercase EVM address.
 */
export type EncodedReferrer = Hex;

/**
 * Encoded Referrer byte offset for ENS Holiday Awards.
 *
 * The count of left-padded bytes in an {@link EncodedReferrer} value for ENS Holiday Awards.
 */
export const ENCODED_REFERRER_BYTE_OFFSET = 12;

/**
 * Encoded Referrer byte length
 *
 * The count of bytes the {@link EncodedReferrer} value consists of.
 */
export const ENCODED_REFERRER_BYTE_LENGTH = 32;

/**
 * Encoded Referrer Padding for ENS Holiday Awards
 *
 * The initial bytes of correctly encoded referrer value for ENS Holiday Awards.
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
 * according to the subjective referrer encoding used for ENS Holiday Awards.
 */
export function buildEncodedReferrer(address: Address): EncodedReferrer {
  const lowercaseAddress = address.toLowerCase() as Address;

  return pad(lowercaseAddress, { size: ENCODED_REFERRER_BYTE_LENGTH, dir: "left" });
}

/**
 * Decode an {@link EncodedReferrer} value into a checksummed {@link Address}
 * according to the subjective referrer encoding used for ENS Holiday Awards.
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

  // return zero address if the padding of encoded referrer is not correct
  // for ENS Holiday Awards
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
