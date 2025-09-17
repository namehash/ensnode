import { type Address, isAddress } from "viem";

/**
 * Converts an EVM address to its lowercase representation.
 *
 * @param maybeAddress - Potential EVM address to convert.
 * @returns The lowercase representation of the EVM address.
 */
export function asLowerCaseAddress(maybeAddress: Address): Address {
  return maybeAddress.toLowerCase() as Address;
}
