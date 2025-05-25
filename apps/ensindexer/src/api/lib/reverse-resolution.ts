import type { CoinType, Name } from "@ensnode/utils";
import { Address } from "viem";

// Represents the set of Primary Names for a given address
type PrimaryNames = Record<CoinType, Name>;

/**
 * Implements Reverse Resolution of a given address.
 *
 * @param address
 * @returns a set of primary Names for this address, by CoinType
 */
export async function resolveReverse(address: Address): Promise<PrimaryNames> {
  return {};
}
