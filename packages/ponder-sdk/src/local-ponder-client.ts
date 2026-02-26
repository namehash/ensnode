import type { BlockNumberRange } from "./blockrange";
import type { CachedPublicClient } from "./cached-public-client";
import type { ChainId, ChainIdString } from "./chains";
import { PonderClient } from "./client";
import { deserializeChainId } from "./deserialize/chains";
import {
  type ChainIndexingMetrics,
  ChainIndexingStates,
  type PonderIndexingMetrics,
} from "./indexing-metrics";
import type {
  LocalChainIndexingMetrics,
  LocalPonderIndexingMetrics,
} from "./local-indexing-metrics";

/**
 * Local Ponder Client
 *
 * It is a specialized client for interacting with a local Ponder app instance.
 * LocalPonderClient extends PonderClient, while adding additional
 * functionality and constraints.
 *
 * Additional functionality includes:
 * - Providing methods to access the indexed blockrange
 *   (see {@link getIndexedBlockrange}) and cached public clients
 *   (see {@link getCachedPublicClient}) for all indexed chains.
 * - Enriching the indexing metrics with additional relevant information
 *   (see {@link LocalPonderIndexingMetrics}).
 *
 * Constraints include:
 * - Validation of the completeness of the Ponder app metadata for
 *   all indexed chains (see {@link validateIndexedChainIds})
 * - Filtering of the Ponder app metadata to only include entries for
 *   indexed chains (see {@link selectEntriesForIndexedChainsOnly})
 */
export class LocalPonderClient extends PonderClient {
  /**
   * Indexed Chain IDs
   *
   * Configured indexed chain IDs which are used to validate and filter
   * the Ponder app metadata to only include entries for indexed chains.
   */
  private indexedChainIds: Set<ChainId>;

  /**
   * Indexed Block Ranges
   *
   * The block ranges that are configured to be indexed for each
   * indexed chain.
   *
   * Invariants:
   * - Includes entries for all {@link indexedChainIds}.
   * - Does not include entries for non-indexed chains.
   */
  private indexedBlockranges: Map<ChainId, BlockNumberRange>;

  /**
   * Cached Public Clients
   *
   * The cached public clients for each indexed chain loaded from
   * the local Ponder app.
   *
   * Invariants:
   * - Includes entries for all {@link indexedChainIds}.
   * - Does not include entries for non-indexed chains.
   */
  private cachedPublicClients: Map<ChainId, CachedPublicClient>;

  /**
   * @param localPonderAppUrl URL of the local Ponder app to connect to.
   * @param indexedChainIds Configured indexed chain IDs which are used to validate and filter the Ponder app metadata to only include entries for indexed chains.
   * @param indexedBlockranges Configured indexing blockrange for each indexed chain.
   * @param ponderPublicClients All cached public clients provided by the local Ponder app
   *                            (may include non-indexed chains).
   */
  constructor(
    localPonderAppUrl: URL,
    indexedChainIds: Set<ChainId>,
    indexedBlockranges: Map<ChainId, BlockNumberRange>,
    ponderPublicClients: Record<ChainIdString, CachedPublicClient>,
  ) {
    super(localPonderAppUrl);

    this.indexedChainIds = indexedChainIds;

    // Build the cached public clients based on the Ponder public clients.
    const cachedPublicClients = LocalPonderClient.buildCachedPublicClients(ponderPublicClients);

    // We don't want to use all chains' records that Ponder may give use.
    // We just need the records for indexed chains (as determined by
    // `indexedChainIds`).
    // Both, `indexedBlockranges` and `cachedPublicClients` are filtered to
    // only include entries for indexed chains.
    this.indexedBlockranges = LocalPonderClient.selectEntriesForIndexedChainsOnly(
      indexedChainIds,
      indexedBlockranges,
      "Indexed Blockranges",
    );
    this.cachedPublicClients = LocalPonderClient.selectEntriesForIndexedChainsOnly(
      indexedChainIds,
      cachedPublicClients,
      "Cached Public Clients",
    );
  }

  /**
   * Get the blockrange that is configured to be indexed for a specific chain ID.
   *
   * @param chainId The chain ID for which to retrieve the indexed blockrange.
   *
   * @returns The indexed blockrange for the specified chain ID.
   * @throws Error if the specified chain ID is not being indexed.
   */
  getIndexedBlockrange(chainId: ChainId): BlockNumberRange {
    const blockrange = this.indexedBlockranges.get(chainId);

    if (!blockrange) {
      throw new Error(
        `Chain ID ${chainId} is not being indexed and therefore has no indexed blockrange.`,
      );
    }

    return blockrange;
  }

  /**
   * Get the cached Public Client for a specific chain ID.
   *
   * @param chainId The chain ID for which to retrieve the cached Public Client.
   * @returns The cached Public Client for the specified chain ID.
   * @throws Error if no cached Public Client is found for the specified chain ID.
   */
  getCachedPublicClient(chainId: ChainId): CachedPublicClient {
    const client = this.cachedPublicClients.get(chainId);

    if (!client) {
      throw new Error(
        `Chain ID ${chainId} is not being indexed and therefore has no cached public client.`,
      );
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

    // We don't want to use all chains' records that Ponder may give use.
    // We just need the records for indexed chains (as determined by
    // `indexedChainIds`).
    const chainsIndexingMetrics = LocalPonderClient.selectEntriesForIndexedChainsOnly(
      this.indexedChainIds,
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
   * Builds a map of cached public clients based on the Ponder cached public clients.
   *
   * Invariants:
   * - all chain IDs in the provided Ponder public clients must be valid Chain IDs.
   *
   * @throws Error if any of the above invariants are violated.
   */
  private static buildCachedPublicClients(
    ponderPublicClients: Record<ChainIdString, CachedPublicClient>,
  ): Map<ChainId, CachedPublicClient> {
    const cachedPublicClients = new Map<ChainId, CachedPublicClient>();

    for (const [chainIdString, ponderPublicClient] of Object.entries(ponderPublicClients)) {
      const chainId = deserializeChainId(chainIdString);

      cachedPublicClients.set(chainId, ponderPublicClient);
    }

    return cachedPublicClients;
  }

  /**
   * Build Local Ponder Indexing Metrics
   *
   * This method takes the original Ponder Indexing Metrics and enriches these
   * metrics with additional relevant information from the LocalPonderClient.
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
      const indexedBlockrange = this.getIndexedBlockrange(chainId);
      const localChainIndexingMetrics = this.buildLocalChainIndexingMetrics(
        indexedBlockrange,
        chainIndexingMetric,
      );

      localChainsIndexingMetrics.set(chainId, localChainIndexingMetrics);
    }

    return {
      ...metrics,
      chains: localChainsIndexingMetrics,
    };
  }

  /**
   * Build Local Chain Indexing Metrics
   *
   * Enrich the original Chain Indexing Metrics from Ponder app with additional
   * relevant information.
   *
   * @param indexedBlockrange Indexed blockrange for the chain which the metrics belong to.
   * @param chainIndexingMetrics The original chain indexing metrics from Ponder app.
   *
   * @returns The enriched local chain indexing metrics.
   */
  private buildLocalChainIndexingMetrics(
    indexedBlockrange: BlockNumberRange,
    chainIndexingMetrics: ChainIndexingMetrics,
  ): LocalChainIndexingMetrics {
    // Keep the original metric if its state is other than "historical".
    if (chainIndexingMetrics.state !== ChainIndexingStates.Historical) {
      return chainIndexingMetrics;
    }

    // For metrics in the "historical" state, a LocalPonderClient has
    // the additional state available (not exposed by Ponder's APIs) to
    // calculate the backfillEndBlock where the historical phase of indexing
    // will be completed.
    const backfillEndBlock =
      indexedBlockrange.startBlock + chainIndexingMetrics.historicalTotalBlocks - 1;

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
   * @param indexedChainIds The set of indexed chain IDs that should be included.
   * @param chainIds The chain IDs to validate.
   * @param valueLabel A label describing the value being validated.
   * @throws Error if any indexed chain ID is missing from the provided chain IDs.
   */
  private static validateIndexedChainIds(
    indexedChainIds: Set<ChainId>,
    unvalidatedChainIds: Iterable<ChainId>,
    valueLabel: string,
  ): void {
    const unvalidatedChainIdsSet = new Set(unvalidatedChainIds);
    const missingChainIds = new Set(
      [...indexedChainIds].filter((x) => !unvalidatedChainIdsSet.has(x)),
    );

    if (missingChainIds.size > 0) {
      throw new Error(
        `Local Ponder Client is missing the ${valueLabel} for indexed chain IDs: ${Array.from(missingChainIds).join(", ")}`,
      );
    }
  }

  /**
   * Select only the indexed chains from the provided map.
   *
   * @param indexedChainIds The set of indexed chain IDs to filter by.
   * @param chains The map of chain IDs to values.
   * @param valueLabel A label describing the value being validated.
   * @returns A new map containing only the indexed chains.
   * @throws Error if any indexed chain ID is missing from the provided map.
   */
  private static selectEntriesForIndexedChainsOnly<EntryType>(
    indexedChainIds: Set<ChainId>,
    chains: Map<ChainId, EntryType>,
    valueLabel: string,
  ): Map<ChainId, EntryType> {
    const filteredMap = new Map<ChainId, EntryType>();

    LocalPonderClient.validateIndexedChainIds(indexedChainIds, chains.keys(), valueLabel);

    for (const [chainId, value] of chains.entries()) {
      if (indexedChainIds.has(chainId)) {
        filteredMap.set(chainId, value);
      }
    }

    return filteredMap;
  }
}
