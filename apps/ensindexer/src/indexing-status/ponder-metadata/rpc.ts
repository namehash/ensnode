import { type BlockNumber, type BlockRef, deserializeBlockRef } from "@ensnode/ensnode-sdk";
import type { PublicClient } from "viem";

export type { PublicClient } from "viem";

/**
 * Fetch block ref from RPC.
 *
 * @param publicClient for a chain
 * @param blockNumber
 *
 * @throws error if data validation fails.
 */
export async function fetchBlockRef(
  publicClient: PublicClient,
  blockNumber: BlockNumber,
): Promise<BlockRef> {
  const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
  if (!block) {
    throw new Error(`Could not fetch block ${blockNumber}`);
  }
  return deserializeBlockRef({
    number: Number(block.number),
    timestamp: Number(block.timestamp),
  });
}
