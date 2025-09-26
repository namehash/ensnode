/**
 * Ponder Metadata: Block Refs
 *
 * This file describes ideas and functionality related to block references
 * based on configured chain names, chains blockranges, and RPC calls.
 */

import type { BlockRef, Blockrange } from "@ensnode/ensnode-sdk";
import type { ChainName } from "./config";
import type { PrometheusMetrics } from "./metrics";
import { type PublicClient, fetchBlockRef } from "./rpc";

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
  chainNames: ChainName[],
  chainsBlockrange: Record<ChainName, Blockrange>,
  metrics: PrometheusMetrics,
  publicClients: Record<ChainName, PublicClient>,
): Promise<Map<ChainName, ChainBlockRefs>> {
  const chainsBlockRefs = new Map<ChainName, ChainBlockRefs>();

  for (const chainName of chainNames) {
    const blockrange = chainsBlockrange[chainName];
    const startBlock = blockrange?.startBlock;
    const endBlock = blockrange?.endBlock;

    const publicClient = publicClients[chainName];

    if (typeof startBlock !== "number") {
      throw new Error(`startBlock not found for chain ${chainName}`);
    }

    if (typeof publicClient === "undefined") {
      throw new Error(`publicClient not found for chain ${chainName}`);
    }

    const historicalTotalBlocks = metrics.getValue("ponder_historical_total_blocks", {
      chain: chainName,
    });

    if (typeof historicalTotalBlocks !== "number") {
      throw new Error(`No historical total blocks metric found for chain ${chainName}`);
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

      chainsBlockRefs.set(chainName, chainBlockRef);
    } catch {
      throw new Error(`Could not get BlockRefs for chain ${chainName}`);
    }
  }

  return chainsBlockRefs;
}
