/**
 * Ponder SDK: RPC
 *
 * This file includes functionality required to read RPC data.
 * The `PublicClient` type matches the type used for values of
 * the `publicClients` object imported by ENSIndexer from the `ponder:api`.
 */

import type { PublicClient } from "viem";

import type { BlockNumber, BlockRef } from "./block-refs";

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

  return {
    number: Number(block.number),
    timestamp: Number(block.timestamp),
  };
}
