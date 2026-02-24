import type { PublicClient } from "viem";

import type { BlockrangeWithStartBlock } from "./blocks";
import type { ChainId } from "./chains";
import { PonderClient } from "./client";
import {
  type ChainIndexingMetrics,
  ChainIndexingStates,
  type PonderIndexingMetrics,
} from "./indexing-metrics";
import type {
  LocalChainIndexingMetrics,
  LocalPonderIndexingMetrics,
} from "./local-indexing-metrics";

export class LocalPonderClient extends PonderClient {
  private indexedChainIds: Set<ChainId>;
  private chainsBlockrange: Map<ChainId, BlockrangeWithStartBlock>;
  private cachedPublicClients: Map<ChainId, PublicClient>;

  constructor(
    ponderAppUrl: URL,
    indexedChainIds: Set<ChainId>,
    chainsBlockrange: Map<ChainId, BlockrangeWithStartBlock>,
    cachedPublicClients: Map<ChainId, PublicClient>,
  ) {
    super(ponderAppUrl);

    this.indexedChainIds = indexedChainIds;
    this.chainsBlockrange = this.selectEntriesForIndexedChainsOnly(
      chainsBlockrange,
      "Chains Blockrange",
    );
    this.cachedPublicClients = this.selectEntriesForIndexedChainsOnly(
      cachedPublicClients,
      "Cached Public Clients",
    );
  }

  /**
   * Get the block range for a specific chain ID.
   * @param chainId The chain ID for which to retrieve the block range.
   * @returns The block range for the specified chain ID.
   * @throws Error if no block range is found for the specified chain ID.
   */
  getChainBlockrange(chainId: ChainId): BlockrangeWithStartBlock {
    const blockrange = this.chainsBlockrange.get(chainId);

    if (!blockrange) {
      throw new Error(`No blockrange found for chain ID: ${chainId}`);
    }

    return blockrange;
  }

  /**
   * Get cached PublicClient for a specific chain ID.
   *
   * @param chainId The chain ID for which to retrieve the cached PublicClient.
   * @returns The cached PublicClient for the specified chain ID.
   * @throws Error if no cached PublicClient is found for the specified chain ID.
   */
  getCachedPublicClient(chainId: ChainId): PublicClient {
    const client = this.cachedPublicClients.get(chainId);

    if (!client) {
      throw new Error(`No cached public client found for chain ID: ${chainId}`);
    }

    return client;
  }

  /**
   * Get Local Ponder Indexing Metrics
   *
   * @returns Local Ponder Indexing Metrics.
   * @throws Error if the response could not be fetched or was invalid.
   */
  async metrics(): Promise<LocalPonderIndexingMetrics> {
    const metrics = await super.metrics();
    const chainsIndexingMetrics = this.selectEntriesForIndexedChainsOnly(
      metrics.chains,
      "Chains Indexing Metrics",
    );

    const localMetrics = this.buildLocalPonderIndexingMetrics({
      ...metrics,
      chains: chainsIndexingMetrics,
    });

    return localMetrics;
  }

  /**
   * Build Local Ponder Indexing Metrics
   *
   * This method takes the original Ponder Indexing Metrics and enriches these
   * metrics with additional relevant information for the LocalPonderClient.
   *
   * @param metrics The original Ponder Indexing Metrics.
   * @returns The enriched Local Ponder Indexing Metrics.
   * @throws Error if any of the invariants are violated.
   */
  private buildLocalPonderIndexingMetrics(
    metrics: PonderIndexingMetrics,
  ): LocalPonderIndexingMetrics {
    const localChainsIndexingMetrics = new Map<ChainId, LocalChainIndexingMetrics>();

    for (const [chainId, chainIndexingMetric] of metrics.chains.entries()) {
      const chainBlockrange = this.getChainBlockrange(chainId);
      const localChainIndexingMetrics = this.buildLocalChainIndexingMetrics(
        chainBlockrange,
        chainIndexingMetric,
      );

      localChainsIndexingMetrics.set(chainId, localChainIndexingMetrics);
    }

    return {
      ...metrics,
      chains: localChainsIndexingMetrics,
    };
  }

  private buildLocalChainIndexingMetrics(
    chainBlockrange: BlockrangeWithStartBlock,
    chainIndexingMetrics: ChainIndexingMetrics,
  ): LocalChainIndexingMetrics {
    // Keep the original metric if its state is other than "historical".
    if (chainIndexingMetrics.state !== ChainIndexingStates.Historical) {
      return chainIndexingMetrics;
    }

    // For a historical metric, enrich it with the backfill end block.
    const backfillEndBlock =
      chainBlockrange.startBlock + chainIndexingMetrics.historicalTotalBlocks - 1;

    return {
      ...chainIndexingMetrics,
      backfillEndBlock,
    };
  }

  /**
   * Validate that the provided chain IDs include all indexed chain IDs for
   * the LocalPonderClient.
   *
   * Useful to validate the completeness of data returned from Ponder app.
   *
   * @param chainIds The chain IDs to validate.
   * @param valueLabel A label describing the value being validated.
   * @throws Error if any indexed chain ID is missing from the provided chain IDs.
   */
  private validateIndexedChainIds(chainIds: Iterable<ChainId>, valueLabel: string): void {
    const actualChainIds = new Set(chainIds);
    const missingChainIds = this.indexedChainIds.difference(actualChainIds);

    if (missingChainIds.size > 0) {
      throw new Error(
        `Local Ponder Client is missing the following indexed chain IDs for ${valueLabel}: ${Array.from(missingChainIds).join(", ")}`,
      );
    }
  }

  /**
   * Select only the indexed chains from the provided map.
   *
   * @param chains The map of chain IDs to values.
   * @param valueLabel A label describing the value being validated.
   * @returns A new map containing only the indexed chains.
   * @throws Error if any indexed chain ID is missing from the provided map.
   */
  private selectEntriesForIndexedChainsOnly<EntryType>(
    chains: Map<ChainId, EntryType>,
    valueLabel: string,
  ): Map<ChainId, EntryType> {
    const filteredMap = new Map<ChainId, EntryType>();

    this.validateIndexedChainIds(chains.keys(), valueLabel);

    for (const [chainId, value] of chains.entries()) {
      if (this.indexedChainIds.has(chainId)) {
        filteredMap.set(chainId, value);
      }
    }

    return filteredMap;
  }
}
