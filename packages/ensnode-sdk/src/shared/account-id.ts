import { AccountId } from "@ensnode/ensnode-sdk";
import { isAddressEqual } from "viem";

/**
 * Determines where the provided AccountId values represent the same address on the same chain.
 */
export const accountIdEqual = (a: AccountId, b: AccountId): boolean => {
  return a.chainId === b.chainId && isAddressEqual(a.address, b.address);
};
