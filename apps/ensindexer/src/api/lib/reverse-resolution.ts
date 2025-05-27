import type { CoinType, Name } from "@ensnode/utils";
import { Address, ccipRequest, Chain, offchainLookup } from "viem";

// Represents the set of Primary Names for a given address
type PrimaryNames = Record<CoinType, Name>;

/**
 * Implements Reverse Resolution of a given address across multiple chains.
 *
 * @param address - The Ethereum address to resolve
 * @param chainIds - Optional array of chain IDs to query. Defaults to mainnet (1)
 *
 * @returns A record mapping coin types to primary names for the given address
 * @example
 * ```ts
 * const names = await resolveReverse("0x123...")
 * // Returns: { "60": "vitalik.eth", "0": "vitalik.eth" }
 * ```
 */
export async function resolveReverse(
  address: Address,
  chainIds: Chain["id"][] = [1],
): Promise<PrimaryNames> {
  // const reverseNodes =
  /**
   * 1. const reverseNode = `${address.toLowerCase().substring(2)}.addr.reverse`
   *  TODO: make that ENSIP-19 compliant with coinType for each coinType supported
   * 2. UniversalResolver#reverse(bytes)
   *   - if OffchainLookup, perform CCIP-Read request
   *     - https://docs.ens.domains/resolvers/ccip-read/
   *   - optimization: decode batch requests and perform locally instead of using batch server
   *     - https://github.com/wevm/viem/blob/main/src/utils/ccip.ts#L91
   *   - must verify data with OffchainLookup resolver using callback
   *     - https://github.com/wevm/viem/blob/main/src/utils/ccip.ts#L98
   *
   *
   */

  // offchainLookup() with data as OffchainLookup revert data
  // localBatchGatewayRequest is local batch gateway Promise.settled instead of remote call
  //   iff x-batch-gateway:true is gateway url
  // ccipRequest is ccip-fetch
  return {};
}
