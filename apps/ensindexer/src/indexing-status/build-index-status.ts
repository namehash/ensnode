import { BlockRef, DeepPartial, ENSIndexerIndexingStatus } from "@ensnode/ensnode-sdk";
import { PublicClient } from "viem";
import { prettifyError } from "zod/v4";

import config from "@/config";
import ponderConfig from "@/ponder/config";

import {
  type ChainName,
  fetchBlockRef,
  fetchPonderMetrics,
  fetchPonderStatus,
  getChainsBlockrange,
  tryGettingBackfillEndBlocks,
} from "./ponder-metadata";
import { makePonderIndexingStatusSchema } from "./ponder-metadata/zod-schemas";

/**
 * Ponder Chain Block Refs
 *
 * Represents information about indexing scope for an indexed chain.
 */
interface ChainBlockRefs {
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

interface ChainStatus {
  chainId: number;
  block: BlockRef;
}

interface ChainMetrics {
  historicalTotalBlocks: number;
  isSyncComplete: number;
  isSyncRealtime: number;
  syncBlock: BlockRef;
}

/**
 * Names for each indexed chain
 */
const chainNames = Object.keys(ponderConfig.chains) as string[];

/**
 * A {@link Blockrange} for each indexed chain.
 *
 * Invariants:
 * - every chain include a startBlock,
 * - some chains may include an endBlock,
 * - all present startBlock and endBlock values are valid {@link BlockNumber} values.
 */
const chainsBlockrange = getChainsBlockrange(ponderConfig);

/**
 * Chain Block Refs
 *
 * {@link ChainBlockRefs} for each indexed chain.
 *
 * Note: works as cache for {@link fetchChainsBlockRefs}.
 */
const chainsBlockRefs = new Map<ChainName, ChainBlockRefs>();

/**
 * Fetch {@link IndexedChainBlockRefs} for indexed chains.
 *
 * Note: performs a network request only once and caches response to
 * re-use it for further `fetchChainsBlockRefs` calls.
 */
async function fetchChainsBlockRefs(
  publicClients: Record<ChainName, PublicClient>,
): Promise<Map<ChainName, ChainBlockRefs>> {
  // early-return the cached chain block refs
  if (chainsBlockRefs.size > 0) {
    return chainsBlockRefs;
  }

  // otherwise, build the chain block refs

  // get backfill end blocks for each chain
  const chainsBackfillEndBlock = await tryGettingBackfillEndBlocks(
    config.ensIndexerUrl,
    chainsBlockrange,
  );

  for (const chainName of chainNames) {
    const blockrange = chainsBlockrange[chainName];
    const startBlock = blockrange?.startBlock;
    const endBlock = blockrange?.endBlock;
    const backfillEndBlock = chainsBackfillEndBlock[chainName];
    const publicClient = publicClients[chainName];

    if (typeof startBlock === "undefined") {
      throw new Error(`startBlock not found for chain ${chainName}`);
    }
    if (typeof backfillEndBlock === "undefined") {
      throw new Error(`backfillEndBlock not found for chain ${chainName}`);
    }
    if (typeof publicClient === "undefined") {
      throw new Error(`publicClient not found for chain ${chainName}`);
    }

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
  }

  return chainsBlockRefs;
}

/**
 * Indexed Chain
 *
 * Includes unvalidated metadata for each indexed chain.
 */
interface IndexedChain {
  blockRefs: ChainBlockRefs;
  metrics: ChainMetrics;
  status: ChainStatus;
}

/**
 * Build {@link ENSIndexerIndexingStatus} object from Ponder metadata
 */
export async function buildIndexingStatus(
  publicClients: Record<ChainName, PublicClient>,
): Promise<ENSIndexerIndexingStatus> {
  // Get current Ponder metadata
  const [metrics, status, chainsBlockRefs] = await Promise.all([
    fetchPonderMetrics(config.ensIndexerUrl),
    fetchPonderStatus(config.ensIndexerUrl),
    fetchChainsBlockRefs(publicClients),
  ]);

  const appSettings = {
    command: metrics.getLabel("ponder_settings_info", "command"),
    ordering: metrics.getLabel("ponder_settings_info", "ordering"),
  };

  const chains = new Map<ChainName, DeepPartial<IndexedChain>>();

  for (const chainName of chainNames) {
    const indexedChain = {
      blockRefs: chainsBlockRefs.get(chainName)!,

      metrics: {
        historicalTotalBlocks: metrics.getValue("ponder_historical_total_blocks", {
          chain: chainName,
        }),
        isSyncComplete: metrics.getValue("ponder_sync_is_complete", { chain: chainName }),
        isSyncRealtime: metrics.getValue("ponder_sync_is_realtime", { chain: chainName }),
        syncBlock: {
          number: metrics.getValue("ponder_sync_block", { chain: chainName }),
          timestamp: metrics.getValue("ponder_sync_block_timestamp", { chain: chainName }),
        },
      },

      status: {
        chainId: status[chainName]?.id,
        block: {
          number: status[chainName]?.block.number,
          timestamp: status[chainName]?.block.timestamp,
        },
      },
    } satisfies DeepPartial<IndexedChain>;

    chains.set(chainName, indexedChain);
  }

  const schema = makePonderIndexingStatusSchema(chainNames);
  const parsed = schema.safeParse({
    appSettings,
    chains,
  });

  if (!parsed.success) {
    throw new Error(
      "Failed to build IndexingStatus object: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  return parsed.data;
}
