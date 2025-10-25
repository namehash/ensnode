import { type Address, bytesToHex, hexToBytes, zeroAddress } from "viem";
import { asLowerCaseAddress } from "../shared";
import type { RawReferrer } from "./types";

/**
 * Interprets a raw referrer value into an {@link Address}.
 *
 * @param rawReferrer - The raw referrer value to interpret.
 * @returns The interpreted referrer address.
 */
export function interpretRawReferrer(rawReferrer: RawReferrer): Address {
  const rawReferrerBytes = hexToBytes(rawReferrer);

  const initialBytes = rawReferrerBytes.slice(0, 12);
  const areAllInitialBytesZero = initialBytes.every((byte) => byte === 0);

  if (!areAllInitialBytesZero) {
    return zeroAddress;
  }

  const remainingBytes = rawReferrerBytes.slice(12, 32);

  return asLowerCaseAddress(bytesToHex(remainingBytes));
}
