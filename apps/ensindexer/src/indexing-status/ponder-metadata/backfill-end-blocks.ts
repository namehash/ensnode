import type { PrometheusMetrics } from "@ensnode/ponder-metadata";
import { fetchPonderMetrics } from "./helpers";
import type {
  BlockNumber,
  Blockrange,
  ChainName,
  PonderBlockRef,
  PonderChainBlockRefs,
  PonderPublicClients,
} from "./types";

/**
 * Get the backfillEndBlock number for each indexed chain.
 *
 * @throws error when `ponder_historical_total_blocks` metric was not found for an indexed chain
 * @throws error when `startBlock` value was not a number for an indexed chain
 *
 * Invariants:
 * - all values are valid {@link BlockNumber}s.
 */
function getBackfillEndBlocks(
  chainsBlockrange: Record<ChainName, Blockrange>,
  metrics: PrometheusMetrics,
): Record<ChainName, BlockNumber> {
  const chainBackfillEndBlocks: Record<ChainName, BlockNumber> = {};

  for (const [chainName, chainBlockrange] of Object.entries(chainsBlockrange)) {
    const historicalTotalBlocks = metrics.getValue("ponder_historical_total_blocks", {
      chain: chainName,
    });

    if (typeof historicalTotalBlocks !== "number") {
      throw new Error(`No historical total blocks metric found for chain ${chainName}`);
    }

    if (typeof chainBlockrange.startBlock !== "number") {
      throw new Error(`No startBlock found for chain ${chainName}`);
    }

    const backfillEndBlock = chainBlockrange.startBlock + historicalTotalBlocks - 1;

    chainBackfillEndBlocks[chainName] = backfillEndBlock;
  }

  return chainBackfillEndBlocks;
}

export const DEFAULT_METRICS_FETCH_TIMEOUT = 10_000;

export const DEFAULT_METRICS_FETCH_INTERVAL = 1_000;

/**
 * Tries getting the backfillEnd block for each indexed chain.
 *
 * Returns a promise may:
 * - resolve successfully if backfillEndBlocks could be fetched
 *   before `backfillEndBlockFetchTimeout` occurs;
 * - otherwise, rejects with an error.
 *
 * Invariants:
 * - every backfillEnd value is a valid {@link BlockNumber}.
 */
async function tryGettingBackfillEndBlocks(
  ponderAppUrl: URL,
  chainsBlockrange: Record<ChainName, Blockrange>,
  backfillEndBlockFetchTimeout = DEFAULT_METRICS_FETCH_TIMEOUT,
  backfillEndBlockFetchInterval = DEFAULT_METRICS_FETCH_INTERVAL,
): Promise<Record<ChainName, BlockNumber>> {
  return new Promise((resolve, reject) => {
    /**
     * Value to be resolved.
     */
    let backfillEndBlocks: Record<ChainName, BlockNumber> | undefined;

    /**
     * To be executed when timeout occurred.
     */
    const backfillEndBlocksTimeout = setTimeout(() => {
      clearInterval(chainsBackfillEndBlockInterval);
      reject(new Error("Could not fetch chainsBackfillEndBlock data."));
    }, backfillEndBlockFetchTimeout);

    /**
     * To be executed when {@link backfillEndBlocks} value was resolved successfully.
     */
    const resolveWithValue = (value: Record<ChainName, BlockNumber>) => {
      clearTimeout(backfillEndBlocksTimeout);
      clearInterval(chainsBackfillEndBlockInterval);

      resolve(value);
    };

    /**
     * To be executed when unrecoverable error occurred.
     */
    const rejectWithError = (errorMessage: string) => {
      clearTimeout(backfillEndBlocksTimeout);
      clearInterval(chainsBackfillEndBlockInterval);

      reject(new Error(errorMessage));
    };

    const chainsBackfillEndBlockInterval = setInterval(async () => {
      try {
        // 0. Fetch Ponder app metrics.
        const ponderMetrics = await fetchPonderMetrics(ponderAppUrl);

        // 1. Get the command which started the Ponder app.
        const ponderSettingsCommand = ponderMetrics.getLabel("ponder_settings_info", "command");
        // Invariant: Ponder app runs in the indexer mode.
        if (ponderSettingsCommand !== "dev" && ponderSettingsCommand !== "start") {
          return rejectWithError(
            `Required metrics not available. The Ponder app at '${ponderAppUrl.href}' must be running in the indexer mode.`,
          );
        }

        // 2. Get the ordering strategy used by Ponder indexer app.
        const ponderSettingsOrdering = ponderMetrics.getLabel("ponder_settings_info", "ordering");
        // Invariant: Ponder indexer app applies the omnichain ordering strategy.
        if (ponderSettingsOrdering !== "omnichain") {
          return rejectWithError(
            `Required metrics not available. The Ponder app at '${ponderAppUrl.href}' must index event using 'omnichain' ordering strategy.`,
          );
        }

        // 3. Get the backfillEndBlock values based on index chains blockrange
        //    configuration and Ponder app metrics.
        // NOTE: If getBackfillEndBlocks throws an error, we treat it as a recoverable one.
        backfillEndBlocks = getBackfillEndBlocks(chainsBlockrange, ponderMetrics);

        // 4. Resolve with backfillEndBlocks value.
        return resolveWithValue(backfillEndBlocks);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        console.warn(`Error fetching backfill end blocks, retrying in 1 second. ${errorMessage}`);
      }
    }, backfillEndBlockFetchInterval);
  });
}

/**
 * Fetch {@link IndexedChainBlockRefs} for indexed chains.
 */
export async function fetchChainsBlockRefs(
  ponderAppUrl: URL,
  chainsBlockrange: Record<ChainName, Blockrange>,
  publicClients: PonderPublicClients,
): Promise<Record<ChainName, PonderChainBlockRefs>> {
  const indexedChainsBlockRefs: Record<ChainName, PonderChainBlockRefs> = {};

  const chainsBackfillEndBlock = await tryGettingBackfillEndBlocks(ponderAppUrl, chainsBlockrange);

  for (const [chainName, blockrange] of Object.entries(chainsBlockrange)) {
    const startBlock = blockrange.startBlock;
    const endBlock = blockrange.endBlock;
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

    const fetchBlock = async (blockNumber: BlockNumber): Promise<PonderBlockRef> => {
      const block = await publicClient.getBlock({
        blockNumber: BigInt(blockNumber),
      });

      if (!block) {
        throw new Error(`Failed to fetch block #${blockNumber} for chain "${chainName}"`);
      }

      return {
        number: Number(block.number),
        timestamp: Number(block.timestamp),
      } satisfies PonderBlockRef;
    };

    const asBlockRef = (block: { number: bigint; timestamp: bigint }) =>
      ({
        number: Number(block.number),
        timestamp: Number(block.timestamp),
      }) satisfies PonderBlockRef;

    const [startBlockRef, endBlockRef, backfillEndBlockRef] = await Promise.all([
      fetchBlock(startBlock),
      endBlock ? fetchBlock(endBlock) : null,
      fetchBlock(backfillEndBlock),
    ]);

    indexedChainsBlockRefs[chainName] = {
      config: {
        startBlock: startBlockRef,
        endBlock: endBlockRef,
      },
      backfillEndBlock: backfillEndBlockRef,
    } satisfies PonderChainBlockRefs;
  }

  return indexedChainsBlockRefs;
}
