import { type Address, getAddress, type Hex, pad, size, slice, zeroAddress } from "viem";

/**
 * Encoded Referrer
 *
 * Represents a "raw" ENS referrer value.
 *
 * Guaranteed to be a hex string representation of a 32-byte value.
 * Correctly encoded referrer is left-padded lowercase EVM address.
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
 * Encoded Referrer Padding
 *
 * The initial bytes of correctly encoded referrer value.
 */
export const encodedReferrerPadding = pad("0x", {
  size: ENCODED_REFERRER_BYTE_OFFSET,
  dir: "left",
});

/**
 * Zero Encoded Referrer
 *
 * Guaranteed to be a hex string representation of a 32-byte zero value.
 */
export const zeroEncodedReferrer = pad("0x", {
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
 */
export function decodeEncodedReferrer(encodedReferrer: Hex): Address {
  // return zero address if encoded referrer is not of expected size
  if (size(encodedReferrer) !== ENCODED_REFERRER_BYTE_LENGTH) {
    return zeroAddress;
  }

  const padding = slice(encodedReferrer, 0, ENCODED_REFERRER_BYTE_OFFSET);

  // return zero address if the padding of encoded referrer is not correct
  if (padding !== encodedReferrerPadding) {
    return zeroAddress;
  }

  const decodedReferrer = slice(encodedReferrer, ENCODED_REFERRER_BYTE_OFFSET);

  try {
    // return checksummed address
    return getAddress(decodedReferrer);
  } catch {
    // fallback to zero address in case decodedReferrer was not a correct address
    return zeroAddress;
  }
}

/**
 * Build a URL to the official ENS manager app
 * where the given {@link Address} is set as the referrer.
 */
export function buildEnsReferralUrl(address: Address): URL {
  const ensAppUrl = new URL("https://app.ens.domains");

  ensAppUrl.searchParams.set("referrer", getAddress(address));

  return ensAppUrl;
}
