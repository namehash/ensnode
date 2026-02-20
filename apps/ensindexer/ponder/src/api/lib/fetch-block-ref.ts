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
  const chainId = publicClient.chain?.id;

  if (!chainId) {
    throw new Error(
      `Public client is missing chain ID, cannot fetch block ref for block number ${blockNumber}`,
    );
  }

  try {
    const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });

    return deserializeBlockRef({
      timestamp: bigIntToNumber(block.timestamp),
      number: bigIntToNumber(block.number),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Error fetching block for chain ID ${chainId} at block number ${blockNumber}: ${errorMessage}`,
    );
  }
}
