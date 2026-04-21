import type { Address, Referrer } from "enssdk";
import { type Hex, type NormalizedAddress, toNormalizedAddress } from "enssdk";
import { pad, size, slice, zeroAddress } from "viem";

/**
 * Encoded Referrer
 *
 * Represents "a Referrer that is guaranteed to be validly encoded"
 *
 * Guaranteed to be a 32-byte hex with 12 bytes of zero padding followed by
 * a 20-byte lowercase address.
 *
 * Constructible only through {@link buildEncodedReferrer} (and {@link ZERO_ENCODED_REFERRER}).
 */
export type EncodedReferrer = Referrer & { readonly __brand: "EncodedReferrer" };

/**
 * Encoded Referrer byte offset
 *
 * The count of left-padded bytes in an {@link Referrer} value.
 */
export const ENCODED_REFERRER_BYTE_OFFSET = 12;

/**
 * Encoded Referrer byte length
 *
 * The count of bytes the {@link Referrer} value consists of.
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
export const ZERO_ENCODED_REFERRER = pad("0x", {
  size: ENCODED_REFERRER_BYTE_LENGTH,
  dir: "left",
}) as EncodedReferrer;

/**
 * Build an {@link EncodedReferrer} value for the given {@link Address}
 * according to the referrer encoding with left-zero-padding.
 *
 * @throws if `address` does not represent an EVM Address
 */
export function buildEncodedReferrer(address: Address): EncodedReferrer {
  const normalizedAddress = toNormalizedAddress(address);

  return pad(normalizedAddress, {
    size: ENCODED_REFERRER_BYTE_LENGTH,
    dir: "left",
  }) as EncodedReferrer;
}

/**
 * Decode an {@link Referrer} value into a {@link NormalizedAddress}
 * according to the referrer encoding with left-zero-padding.
 *
 * @param referrer - The "raw" {@link Referrer} value to decode.
 * @returns The decoded referrer address.
 * @throws when referrer value is not represented by
 *         {@link ENCODED_REFERRER_BYTE_LENGTH} bytes.
 * @throws when decodedReferrer is not a valid EVM address.
 */
export function decodeReferrer(referrer: Referrer): NormalizedAddress {
  // Invariant: encoded referrer must be of expected size
  if (size(referrer) !== ENCODED_REFERRER_BYTE_LENGTH) {
    throw new Error(
      `Encoded referrer value must be represented by ${ENCODED_REFERRER_BYTE_LENGTH} bytes.`,
    );
  }

  const padding = slice(referrer, 0, ENCODED_REFERRER_BYTE_OFFSET);

  // strict validation: padding must be all zeros
  // if any byte in the padding is non-zero, treat as Zero Encoded Referrer
  if (padding !== EXPECTED_ENCODED_REFERRER_PADDING) return zeroAddress;

  const decodedReferrer = slice(referrer, ENCODED_REFERRER_BYTE_OFFSET);

  try {
    // return normalized address
    return toNormalizedAddress(decodedReferrer);
  } catch {
    throw new Error(`Decoded referrer value must be a valid EVM address.`);
  }
}
