import { type Address, isAddress } from "viem";

/**
 * Converts an EVM address to its lowercase representation.
 *
 * @param maybeAddress - Potential EVM address to convert.
 * @returns The lowercase representation of the EVM address.
 * @throws Will throw an error if the input is not a valid EVM address.
 */
export function asLowerCaseAddress(maybeAddress: string): Address {
  if (!isAddress(maybeAddress)) {
    throw new Error(`Cannot make an invalid EVM address "${maybeAddress}" lowercase.`);
  }

  return maybeAddress.toLowerCase() as Address;
}
