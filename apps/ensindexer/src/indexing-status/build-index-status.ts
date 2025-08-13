/**
 * Build Indexing Status
 *
 * This file includes ideas and functionality integrating Ponder Metadata
 * with ENSIndexer application. Here all Ponder Metadata concepts, such as
 * - chain configuration from `ponder.config.ts` file,
 * - metrics from `/metrics` endpoint,
 * - publicClients from `ponder:api` import,
 * - status from `/status` endpoint,
 * all turn into the ENSIndexer data model.
 */

import {
  type BlockRef,
  ENSIndexerOverallIndexingErrorStatus,
  ENSIndexerOverallIndexingStatus,
  OverallIndexingStatusIds,
  deserializeENSIndexerIndexingStatus,
} from "@ensnode/ensnode-sdk";
import { prettifyError } from "zod/v4";

import config from "@/config";
import ponderConfig from "@/ponder/config";
import {
  type ChainName,
  type PonderStatus,
  type PrometheusMetrics,
  type PublicClient,
  type UnvalidatedChainMetadata,
  fetchBlockRef,
  fetchPonderMetrics,
  fetchPonderStatus,
  getChainsBlockrange,
} from "./ponder-metadata";
import {
  PonderAppSettingsSchema,
  makePonderChainMetadataSchema,
} from "./ponder-metadata/zod-schemas";

/**
 * Chain Block Refs
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
 * Get {@link IndexedChainBlockRefs} for indexed chains.
 *
 * Guaranteed to include {@link ChainBlockRefs} for each indexed chain.
 *
 * Note: performs a network request only once and caches response to
 * re-use it for further `fetchChainsBlockRefs` calls.
 */
async function getChainsBlockRefs(
  metrics: PrometheusMetrics,
  publicClients: Record<ChainName, PublicClient>,
): Promise<Map<ChainName, ChainBlockRefs>> {
  // early-return the cached chain block refs
  if (chainsBlockRefs.size > 0) {
    return chainsBlockRefs;
  }

  // otherwise, build the chain block refs

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

/**
 * Build {@link ENSIndexerIndexingStatus} object from Ponder metadata.
 *
 * Note: Ponder metadata must come from an ENSIndexer instance that is
 * guaranteed to provide indexing status data.
 * @see https://ponder.sh/docs/api-reference/ponder/cli#dev
 * @see https://ponder.sh/docs/api-reference/ponder/cli#start
 *
 * @throws error when fetched Ponder Metadata was invalid.
 */
export async function buildIndexingStatus(
  publicClients: Record<ChainName, PublicClient>,
): Promise<ENSIndexerOverallIndexingStatus> {
  let metrics: PrometheusMetrics;
  let status: PonderStatus;

  try {
    // Get current Ponder metadata (metrics, status)
    const [ponderMetrics, ponderStatus] = await Promise.all([
      fetchPonderMetrics(config.ensIndexerUrl),
      fetchPonderStatus(config.ensIndexerUrl),
    ]);

    metrics = ponderMetrics;
    status = ponderStatus;
  } catch (error) {
    console.error(`Could not fetch data from ENSIndexer at ${config.ensIndexerUrl.href}`);

    return deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.IndexerError,
    } satisfies ENSIndexerOverallIndexingErrorStatus);
  }

  // Invariant: Ponder command & ordering are as expected
  const parsedAppSettings = PonderAppSettingsSchema.safeParse({
    command: metrics.getLabel("ponder_settings_info", "command"),
    ordering: metrics.getLabel("ponder_settings_info", "ordering"),
    systemDate: new Date(),
  });

  if (parsedAppSettings.error) {
    throw new Error(
      "Failed to build IndexingStatus object: \n" + prettifyError(parsedAppSettings.error) + "\n",
    );
  }

  // get BlockRefs for relevant blocks
  const chainsBlockRefs = await getChainsBlockRefs(metrics, publicClients);

  const chains = new Map<ChainName, UnvalidatedChainMetadata>();

  // collect unvalidated chain metadata for each indexed chain
  for (const chainName of chainNames) {
    const chainBlockRefs = chainsBlockRefs.get(chainName);

    const chainMetadata = {
      chainId: status[chainName]?.id,
      config: chainBlockRefs?.config,
      backfillEndBlock: chainBlockRefs?.backfillEndBlock,
      historicalTotalBlocks: metrics.getValue("ponder_historical_total_blocks", {
        chain: chainName,
      }),
      isSyncComplete: metrics.getValue("ponder_sync_is_complete", { chain: chainName }),
      isSyncRealtime: metrics.getValue("ponder_sync_is_realtime", { chain: chainName }),
      syncBlock: {
        number: metrics.getValue("ponder_sync_block", { chain: chainName }),
        timestamp: metrics.getValue("ponder_sync_block_timestamp", { chain: chainName }),
      },
      statusBlock: {
        number: status[chainName]?.block.number,
        timestamp: status[chainName]?.block.timestamp,
      },
    } satisfies UnvalidatedChainMetadata;

    chains.set(chainName, chainMetadata);
  }

  // parse chain metadata for each indexed chain
  const schema = makePonderChainMetadataSchema(chainNames);
  const parsed = schema.safeParse({
    appSettings: parsedAppSettings.data,
    chains,
  });

  if (!parsed.success) {
    throw new Error(
      "Failed to build IndexingStatus object: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  // construct the final ENSIndexerIndexingStatus object from validated chain metadata
  return deserializeENSIndexerIndexingStatus(parsed.data);
}
