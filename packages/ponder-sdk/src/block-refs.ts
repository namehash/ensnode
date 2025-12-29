/**
 * Ponder SDK: Block Refs
 *
 * This file describes ideas and functionality related to block references
 * based on configured chain names, chains blockranges, and RPC calls.
 */

import type { PublicClient } from "viem";

import type { ChainIdString } from "./chains";
import type { PrometheusMetrics } from "./metrics";
import { fetchBlockRef } from "./rpc";
import type { UnixTimestamp } from "./time";

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = number;

/**
 * BlockRef
 *
 * Describes a block.
 *
 * We use parameter types to maintain fields layout and documentation across
 * the domain model and its serialized counterpart.
 */
export interface BlockRef {
  /** Block number (height) */
  number: BlockNumber;

  /** Block timestamp */
  timestamp: UnixTimestamp;
}

/**
 * Block range
 *
 * Represents a range of blocks
 */
export interface Blockrange<BlockType = BlockNumber> {
  /** Start block number */
  startBlock?: BlockType;

  /** End block number */
  endBlock?: BlockType;
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
 *
 * @throws Error if prerequisites are not met:
 * - no startBlock found for a chain,
 * - no PublicClient found for a chain,
 * - no historical total blocks metric found for a chain,
 * - could not get BlockRefs for a chain.
 */
export async function getChainsBlockRefs(
  chainIds: ChainIdString[],
  chainsBlockrange: Record<ChainIdString, Blockrange>,
  historicalTotalBlocksForChains: Record<ChainIdString, number>,
  publicClients: Record<ChainIdString, PublicClient>,
): Promise<Map<ChainIdString, ChainBlockRefs>> {
  const chainsBlockRefs = new Map<ChainIdString, ChainBlockRefs>();

  for (const chainId of chainIds) {
    const blockrange = chainsBlockrange[chainId];
    const startBlock = blockrange?.startBlock;
    const endBlock = blockrange?.endBlock;

    const publicClient = publicClients[chainId];

    if (typeof startBlock !== "number") {
      throw new Error(`startBlock not found for chain ${chainId}`);
    }

    if (typeof publicClient === "undefined") {
      throw new Error(`publicClient not found for chain ${chainId}`);
    }

    const historicalTotalBlocks = historicalTotalBlocksForChains[chainId];

    if (typeof historicalTotalBlocks !== "number") {
      throw new Error(`No historical total blocks metric found for chain: ${chainId}`);
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

export function buildHistoricalTotalBlocksForChains(
  indexedChainIds: ChainIdString[],
  metrics: PrometheusMetrics,
): Record<ChainIdString, number> {
  const historicalTotalBlocksForChains = {} as Record<ChainIdString, number>;

  for (const chainId of indexedChainIds) {
    const historicalTotalBlocksMetric = metrics.getValue("ponder_historical_total_blocks", {
      chain: chainId,
    });

    if (typeof historicalTotalBlocksMetric !== "number") {
      throw new Error(`No historical total blocks metric found for chain: ${chainId}`);
    }

    historicalTotalBlocksForChains[chainId] = historicalTotalBlocksMetric;
  }

  return historicalTotalBlocksForChains;
}
