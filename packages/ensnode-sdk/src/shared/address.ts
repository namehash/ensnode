import { type Address, isAddress } from "viem";

/**
 * Converts an EVM address to its lowercase representation.
 *
 * @param address - EVM address to convert.
 * @returns The lowercase representation of the EVM address.
 */
export function asLowerCaseAddress(address: Address): Address {
  return address.toLowerCase() as Address;
}
