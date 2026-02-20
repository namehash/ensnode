import type { ChainId, PonderIndexingMetrics, PonderIndexingStatus } from "@ensnode/ponder-sdk";

import type { ChainIndexingMetadataDynamic } from "@/lib/indexing-status-builder/chain-indexing-metadata";

/**
 * Build a map of chain ID to its dynamic indexing metadata.
 *
 * The dynamic metadata is based on the current indexing metrics and status
 * of the chain, which can change over time as the chain is being indexed.
 *
 * @param indexedChainIds A set of chain IDs that are being indexed.
 * @param ponderIndexingMetrics The current indexing metrics for all chains.
 * @param ponderIndexingStatus The current indexing status for all chains.
 *
 * @returns A map of chain ID to its dynamic indexing metadata.
 *
 * @throws Error if any invariants are violated.
 */
export function buildChainsIndexingMetadataDynamic(
  indexedChainIds: Set<ChainId>,
  ponderIndexingMetrics: PonderIndexingMetrics,
  ponderIndexingStatus: PonderIndexingStatus,
): Map<ChainId, ChainIndexingMetadataDynamic> {
  const chainsIndexingMetadataDynamic = new Map<ChainId, ChainIndexingMetadataDynamic>();

  for (const chainId of indexedChainIds.values()) {
    const chainIndexingMetrics = ponderIndexingMetrics.chains.get(chainId);
    const chainIndexingStatus = ponderIndexingStatus.chains.get(chainId);

    // Invariants: indexing metrics and indexing status must exist in proper state for the indexed chain.
    if (!chainIndexingMetrics) {
      throw new Error(`Indexing metrics must be available for indexed chain ID ${chainId}`);
    }

    if (!chainIndexingStatus) {
      throw new Error(`Indexing status must be available for indexed chain ID ${chainId}`);
    }

    const metadataDynamic = {
      indexingMetrics: chainIndexingMetrics,
      indexingStatus: chainIndexingStatus,
    } satisfies ChainIndexingMetadataDynamic;

    chainsIndexingMetadataDynamic.set(chainId, metadataDynamic);
  }

  return chainsIndexingMetadataDynamic;
}
