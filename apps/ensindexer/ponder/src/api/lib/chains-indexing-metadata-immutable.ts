import type { PublicClient } from "viem";

import { createIndexingConfig } from "@ensnode/ensnode-sdk";
import {
  type BlockRef,
  type BlockrangeWithStartBlock,
  type ChainId,
  ChainIndexingStates,
  type PonderIndexingMetrics,
} from "@ensnode/ponder-sdk";

import type { ChainIndexingMetadataImmutable } from "@/lib/indexing-status-builder/chain-indexing-metadata";

import { fetchBlockRef } from "./fetch-block-ref";

/**
 * Build an immutable indexing metadata for a chain.
 *
 * Some of the metadata fields are based on RPC calls to fetch block references.
 *
 * @param startBlock Chain's start block.
 * @param endBlock Chain's end block (optional).
 * @param backfillEndBlock Chain's backfill end block.
 *
 * @returns The immutable indexing metadata for the chain.
 */
function buildChainIndexingMetadataImmutable(
  startBlock: BlockRef,
  endBlock: BlockRef | null,
  backfillEndBlock: BlockRef,
): ChainIndexingMetadataImmutable {
  const chainIndexingConfig = createIndexingConfig(startBlock, endBlock);

  return {
    backfillScope: {
      startBlock,
      endBlock: backfillEndBlock,
    },
    indexingConfig: chainIndexingConfig,
  };
}

/**
 * Map of chain ID to its immutable indexing metadata.
 */
export type ChainsIndexingMetadataImmutable = Map<ChainId, ChainIndexingMetadataImmutable>;

/**
 * Build a map of chain ID to its immutable indexing metadata.
 *
 * @param indexedChainIds Set of indexed chain IDs.
 * @param chainsConfigBlockrange Map of chain ID to its configured blockrange.
 * @param publicClients Map of chain ID to its cached public client.
 * @param ponderIndexingMetrics Ponder indexing metrics for each chain.
 * @returns A map of chain ID to its immutable indexing metadata.
 * @throws Error if any of the required data cannot be fetched or is invalid,
 *         or if invariants are violated.
 */
export async function buildChainsIndexingMetadataImmutable(
  indexedChainIds: Set<ChainId>,
  chainsConfigBlockrange: Map<ChainId, BlockrangeWithStartBlock>,
  publicClients: Map<ChainId, PublicClient>,
  ponderIndexingMetrics: PonderIndexingMetrics,
): Promise<Map<ChainId, ChainIndexingMetadataImmutable>> {
  const chainsIndexingMetadataImmutable = new Map<ChainId, ChainIndexingMetadataImmutable>();

  for (const chainId of indexedChainIds) {
    const chainConfigBlockrange = chainsConfigBlockrange.get(chainId);
    const chainIndexingMetrics = ponderIndexingMetrics.chains.get(chainId);
    const publicClient = publicClients.get(chainId);

    // Invariants: chain config blockrange, indexing metrics, and public client
    // must exist in proper state for the indexed chain.
    if (!chainConfigBlockrange) {
      throw new Error(`Chain config blockrange must be available for indexed chain ID ${chainId}`);
    }

    if (!chainIndexingMetrics) {
      throw new Error(`Indexing metrics must be available for indexed chain ID ${chainId}`);
    }

    if (chainIndexingMetrics.state !== ChainIndexingStates.Historical) {
      throw new Error(
        `Chain indexing state must be "historical" for indexed chain ID ${chainId}, but got "${chainIndexingMetrics.state}"`,
      );
    }

    if (!publicClient) {
      throw new Error(`Public client must be available for indexed chain ID ${chainId}`);
    }

    const backfillEndBlockNumber =
      chainConfigBlockrange.startBlock + chainIndexingMetrics.historicalTotalBlocks - 1;

    // Fetch required block references in parallel.
    const [startBlock, endBlock, backfillEndBlock] = await Promise.all([
      fetchBlockRef(publicClient, chainConfigBlockrange.startBlock),
      chainConfigBlockrange.endBlock
        ? fetchBlockRef(publicClient, chainConfigBlockrange.endBlock)
        : null,
      fetchBlockRef(publicClient, backfillEndBlockNumber),
    ]);

    const metadataImmutable = buildChainIndexingMetadataImmutable(
      startBlock,
      endBlock,
      backfillEndBlock,
    );

    chainsIndexingMetadataImmutable.set(chainId, metadataImmutable);
  }

  return chainsIndexingMetadataImmutable;
}
