import { isAddress } from "viem";

import type { Address, NormalizedAddress } from "./types";

/**
 * Determines whether an {@link Address} is a {@link NormalizedAddress}.
 */
export function isNormalizedAddress(address: Address): address is NormalizedAddress {
  const isLowerCase = address === address.toLowerCase();
  return isLowerCase && isAddress(address, { strict: false });
}

/**
 * Converts an {@link Address} to a {@link NormalizedAddress}.
 *
 * @throws if `address` does not represent an EVM Address
 */
export function toNormalizedAddress(maybeAddress: string): NormalizedAddress {
  if (!isAddress(maybeAddress, { strict: false })) {
    throw new Error(`'${maybeAddress}' does not represent an EVM Address.`);
  }

  return maybeAddress.toLowerCase() as NormalizedAddress;
}

/**
 * Validates that an {@link Address} is already a {@link NormalizedAddress}.
 *
 * @throws if the address is not already normalized
 */
export function asNormalizedAddress(address: Address): NormalizedAddress {
  if (isNormalizedAddress(address)) return address;

  throw new Error(`Not a NormalizedAddress: '${address}'`);
}
