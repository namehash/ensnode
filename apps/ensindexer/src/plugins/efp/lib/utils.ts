import { type Address, getAddress } from "viem";

/**
 * EVM Address type.
 *
 * Represents a normalized EVM address, which is always in lowercase.
 * This type is used to ensure that EVM addresses are consistently formatted.
 *
 * Note: To prevent any `Address` value from being able to be represented as an EvmAddress, we apply a brand to the type.
 */
export type EvmAddress = Address & { __brand: "EvmAddress" };

/**
 * Parses an EVM address value.
 *
 * @param {string} value - The EVM address string to parse.
 * @returns {EvmAddress} The normalized EVM address in lowercase.
 */
export function parseEvmAddress(value: string): EvmAddress {
  return getAddress(value).toLowerCase() as EvmAddress;
}

export type ListTokenId = bigint & { __brand: "ListTokenId" };

/**
 * Parses a List Token ID from a string representation.
 *
 * @param value - The string representation of a List Token ID (uint256).
 * @returns {ListTokenId} The parsed List Token ID.
 */
export function parseListTokenId(value: string): ListTokenId {
  let listTokenId: bigint;

  try {
    listTokenId = BigInt(value);
  } catch (error) {
    throw new Error(
      `List Token ID "${value}" is invalid. It must be a string representation of uint256 value.`,
    );
  }

  if (listTokenId < 0) {
    throw new Error(`List Token ID "${value}" is invalid. It must be a non-negative value.`);
  }

  return listTokenId as ListTokenId;
}
