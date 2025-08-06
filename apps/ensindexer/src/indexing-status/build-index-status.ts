import ponderConfig from "@/ponder/config";

import {
  type ChainName,
  type PartialPonderChainMetrics,
  type PartialPonderChainStatus,
  PonderMetadata,
  getChainsBlockrange,
} from "@/indexing-status/ponder-metadata";

import { makePonderIndexingStatusSchema } from "@/indexing-status/zod-schemas";
import { ENSIndexerIndexingStatus } from "@ensnode/ensnode-sdk";
import { prettifyError } from "zod/v4";

export const indexedChainNames = Object.keys(ponderConfig.chains) as string[];

/**
 * A {@link Blockrange} for each indexed chain.
 *
 * Invariants:
 * - every chain include a startBlock,
 * - some chains may include an endBlock,
 * - all present startBlock and endBlock values are valid {@link BlockNumber} values.
 */
export const indexedChainsBlockrange = getChainsBlockrange(ponderConfig);

/**
 * Build {@link ENSIndexerIndexingStatus} object from Ponder metadata
 */
export async function buildIndexingStatus(
  ponderMetadata: PonderMetadata,
): Promise<ENSIndexerIndexingStatus> {
  const { chainsBlockRefs, metrics, status } = ponderMetadata;

  const appSettings = {
    command: metrics.getLabel("ponder_settings_info", "command"),
    ordering: metrics.getLabel("ponder_settings_info", "ordering"),
  };

  const chainsMetrics: Record<ChainName, PartialPonderChainMetrics> = {};
  const chainsStatuses: Record<ChainName, PartialPonderChainStatus> = {};

  for (const chainName of indexedChainNames) {
    chainsMetrics[chainName] = {
      historicalCompletedBlocks: metrics.getValue("ponder_historical_completed_blocks", {
        chain: chainName,
      }),
      historicalCachedBlocks: metrics.getValue("ponder_historical_cached_blocks", {
        chain: chainName,
      }),
      historicalTotalBlocks: metrics.getValue("ponder_historical_total_blocks", {
        chain: chainName,
      }),
      isSyncComplete: metrics.getValue("ponder_sync_is_complete", { chain: chainName }),
      isSyncRealtime: metrics.getValue("ponder_sync_is_realtime", { chain: chainName }),
      syncBlock: {
        number: metrics.getValue("ponder_sync_block", { chain: chainName }),
        timestamp: metrics.getValue("ponder_sync_block_timestamp", { chain: chainName }),
      },
    } satisfies PartialPonderChainMetrics;

    const chainStatus = status[chainName];

    chainsStatuses[chainName] = {
      chainId: chainStatus?.id,
      block: {
        number: chainStatus?.block.number,
        timestamp: chainStatus?.block.timestamp,
      },
    } satisfies PartialPonderChainStatus;
  }

  const parsed = makePonderIndexingStatusSchema(indexedChainNames).safeParse({
    appSettings,
    chainsStatuses,
    chainsMetrics,
    chainsBlockRefs,
  });

  if (!parsed.success) {
    throw new Error(
      "Failed to build IndexingStatus object: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  return parsed.data;
}
