/**
 * Ponder SDK: Block Refs
 *
 * This file describes ideas and functionality related to block references
 * based on configured chain names, chains blockranges, and RPC calls.
 */

import type { PublicClient } from "viem";

import type { PrometheusMetrics } from "./metrics";
import { fetchBlockRef } from "./rpc";
import type { ChainName } from "./shared";
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
  chainNames: ChainName[],
  chainsBlockrange: Record<ChainName, Blockrange>,
  historicalTotalBlocksForChains: Record<ChainName, number>,
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

    const historicalTotalBlocks = historicalTotalBlocksForChains[chainName];

    if (typeof historicalTotalBlocks !== "number") {
      throw new Error(`No historical total blocks metric found for chain: ${chainName}`);
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

export function buildHistoricalTotalBlocksForChains(
  indexedChainNames: ChainName[],
  metrics: PrometheusMetrics,
): Record<ChainName, number> {
  const historicalTotalBlocksForChains = {} as Record<ChainName, number>;

  for (const chainName of indexedChainNames) {
    const historicalTotalBlocksMetric = metrics.getValue("ponder_historical_total_blocks", {
      chain: chainName,
    });

    if (typeof historicalTotalBlocksMetric !== "number") {
      throw new Error(`No historical total blocks metric found for chain: ${chainName}`);
    }

    historicalTotalBlocksForChains[chainName] = historicalTotalBlocksMetric;
  }

  return historicalTotalBlocksForChains;
}
