import { type Address, isAddress } from "viem";

/**
 * Converts an EVM address to its lowercase representation.
 *
 * @param maybeAddress - Potential EVM address to convert.
 * @returns The lowercase representation of the EVM address.
 * @throws an Error if the input is not a valid EVM address.
 */
export function asLowerCaseAddress(maybeAddress: string): Address {
  if (!isAddress(maybeAddress)) {
    throw new Error(
      `Invalid EVM address "${maybeAddress}" cannot be converted to a lowercase address.`,
    );
  }

  return maybeAddress.toLowerCase() as Address;
}
