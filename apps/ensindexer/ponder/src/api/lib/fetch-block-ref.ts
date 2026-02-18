import type { PublicClient } from "viem";

import { bigIntToNumber, deserializeBlockRef } from "@ensnode/ensnode-sdk";
import type { BlockNumber, BlockRef } from "@ensnode/ponder-sdk";

/**
 * Fetch block reference (number and timestamp) for a given block number on
 * a given chain, using the provided public client.
 *
 * @returns Requested block reference
 * @throws Error if the block cannot be fetched or if the block data is invalid.
 */
export async function fetchBlockRef(
  publicClient: PublicClient,
  blockNumber: BlockNumber,
): Promise<BlockRef> {
  try {
    const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });

    return deserializeBlockRef({
      timestamp: bigIntToNumber(block.timestamp),
      number: bigIntToNumber(block.number),
    });
  } catch {
    throw new Error(
      `Error fetching block for chain ID ${publicClient.getChainId()} at block number ${blockNumber}: }`,
    );
  }
}
