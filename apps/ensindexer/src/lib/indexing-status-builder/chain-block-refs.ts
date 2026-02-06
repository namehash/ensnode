import type { PublicClient } from "viem";

import { bigIntToNumber, deserializeBlockRef } from "@ensnode/ensnode-sdk";
import type {
  BlockNumber,
  BlockRef,
  Blockrange,
  ChainId,
  ChainIndexingMetrics,
} from "@ensnode/ponder-sdk";

/**
 * Fetch block ref from RPC.
 *
 * @param publicClient for a chain
 * @param blockNumber
 *
 * @throws error if data validation fails.
 */
async function fetchBlockRef(
  publicClient: PublicClient,
  blockNumber: BlockNumber,
): Promise<BlockRef> {
  try {
    const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });

    return deserializeBlockRef({
      number: bigIntToNumber(block.number),
      timestamp: bigIntToNumber(block.timestamp),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch block ref for block number ${blockNumber}: ${errorMessage}`);
  }
}

/**
 * Chain Block Refs
 *
 * Represents information about indexing scope for an indexed chain.
 */
export interface ChainBlockRefs {
  /**
   * Based on Ponder Configuration
   */
  config: {
    startBlock: BlockRef;

    endBlock: BlockRef | null;
  };

  /**
   * Based on Ponder runtime metrics
   */
  backfillEndBlock: BlockRef;
}

/**
 * Get {@link IndexedChainBlockRefs} for indexed chains.
 *
 * Guaranteed to include {@link ChainBlockRefs} for each indexed chain.
 */
export async function getChainsBlockRefs(
  chainIds: ChainId[],
  chainsConfigBlockrange: Record<ChainId, Blockrange>,
  chainsIndexingMetrics: Map<ChainId, ChainIndexingMetrics>,
  publicClients: Record<ChainId, PublicClient>,
): Promise<Map<ChainId, ChainBlockRefs>> {
  const chainsBlockRefs = new Map<ChainId, ChainBlockRefs>();

  for (const chainId of chainIds) {
    const blockrange = chainsConfigBlockrange[chainId];
    const startBlock = blockrange?.startBlock;
    const endBlock = blockrange?.endBlock;
    const publicClient = publicClients[chainId];
    const indexingMetrics = chainsIndexingMetrics.get(chainId);

    if (typeof startBlock !== "number") {
      throw new Error(`startBlock not found for chain ${chainId}`);
    }

    if (typeof publicClient === "undefined") {
      throw new Error(`publicClient not found for chain ${chainId}`);
    }

    if (typeof indexingMetrics === "undefined") {
      throw new Error(`indexingMetrics not found for chain ${chainId}`);
    }

    const historicalTotalBlocks = indexingMetrics.backfillSyncBlocksTotal;

    if (typeof historicalTotalBlocks !== "number") {
      throw new Error(`No historical total blocks metric found for chain ${chainId}`);
    }

    const backfillEndBlock = startBlock + historicalTotalBlocks - 1;

    try {
      // fetch relevant block refs using RPC
      const [startBlockRef, endBlockRef, backfillEndBlockRef] = await Promise.all([
        fetchBlockRef(publicClient, startBlock),
        endBlock ? fetchBlockRef(publicClient, endBlock) : null,
        fetchBlockRef(publicClient, backfillEndBlock),
      ]);

      const chainBlockRef = {
        config: {
          startBlock: startBlockRef,
          endBlock: endBlockRef,
        },
        backfillEndBlock: backfillEndBlockRef,
      } satisfies ChainBlockRefs;

      chainsBlockRefs.set(chainId, chainBlockRef);
    } catch {
      throw new Error(`Could not get BlockRefs for chain ${chainId}`);
    }
  }

  return chainsBlockRefs;
}
