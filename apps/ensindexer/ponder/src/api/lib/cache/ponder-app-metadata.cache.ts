import config from "@/config";

import { type Duration, SWRCache } from "@ensnode/ensnode-sdk";
import { type ChainId, ChainIndexingStates, PonderClient } from "@ensnode/ponder-sdk";

import type {
  ChainIndexingMetadata,
  ChainIndexingMetadataDynamic,
  ChainIndexingMetadataImmutable,
} from "@/lib/indexing-status-builder/chain-indexing-metadata";
import { fetchBlockRef } from "@/ponder/api/lib/fetch-block-ref";

import { buildChainsBlockrange } from "../chains-config-blockrange";
import { buildChainIndexingMetadataImmutable } from "../chains-indexing-metadata-immutable";
import { buildPonderCachedPublicClients } from "../ponder-cached-public-clients";

/**
 * Metadata from a Ponder app.
 */
export interface PonderAppMetadata {
  chainsIndexingMetadata: Map<ChainId, ChainIndexingMetadata>;
}

/**
 * SWR Cache for Ponder App Metadata
 */
export type PonderAppMetadataCache = SWRCache<PonderAppMetadata>;

const indexedChainIds = config.indexedChainIds;
const chainsConfigBlockrange = buildChainsBlockrange();
const ponderCachedPublicClients = buildPonderCachedPublicClients();
const ponderClient = new PonderClient(config.ensIndexerUrl);

/**
 * Cache for Ponder App Metadata
 *
 * In case of using multiple Ponder API endpoints, it is optimal for data
 * consistency to call all endpoints at once. This cache loads both
 * Ponder Indexing Metrics and Ponder Indexing Status together, and provides
 * them as a single cached result. This way, we ensure that the metrics and
 * status data are always from (approximately) the same point in time, and
 * minimize potential inconsistencies that could arise if they were loaded
 * separately.
 *
 * Ponder Client may sometimes fail to load data, i.e. due to network issues.
 * The cache is designed to be resilient to loading failures, and will keep data
 * in the cache indefinitely until it can be successfully reloaded.
 * See `ttl` option below.
 *
 * Ponder Indexing Metrics and Ponder Indexing Status can both change frequently,
 * so the cache is designed to proactively revalidate data to ensure freshness.
 * See `proactiveRevalidationInterval` option below.
 *
 * Note, that Ponder app needs a while at startup to populate indexing metrics,
 * and indexing status, so a few of the initial attempts to load this cache may
 * fail until required data is made available by the Ponder app.
 *
 * Loading cache data includes making RPC calls to fetch relevant
 * block references for all indexed chains. RPC calls may sometimes fail due to
 * transient network issues, so the cache is designed to be resilient to such
 * failures as well.
 */
export const ponderAppMetadataCache = new SWRCache({
  fn: async function loadPonderAppMetadataCache(cachedResult) {
    const currentResult = {
      chainsIndexingMetadata: new Map<ChainId, ChainIndexingMetadata>(),
    } satisfies PonderAppMetadata;

    try {
      const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
        ponderClient.metrics(),
        ponderClient.status(),
      ]);

      const chainIdsFromMetrics = Array.from(ponderIndexingMetrics.chains.keys());
      const chainIdsFromStatus = Array.from(ponderIndexingStatus.chains.keys());
      const areChainIdsConsistent = Array.from(indexedChainIds.values()).every(
        (chainId) => chainIdsFromStatus.includes(chainId) && chainIdsFromMetrics.includes(chainId),
      );

      // Invariant: indexed chain IDs from Ponder Indexing Metrics and
      // Ponder Indexing Status must be consistent the configured
      // indexed chain IDs.
      if (areChainIdsConsistent === false) {
        throw new Error(
          `Indexed chain IDs from Ponder Indexing Metrics and Status must be consistent with each other and with config. ` +
            `Chain IDs from Metrics: ${chainIdsFromMetrics.join(", ")}, ` +
            `Chain IDs from Status: ${chainIdsFromStatus.join(", ")}, ` +
            `Indexed Chain IDs from ENSIndexer config: ${Array.from(indexedChainIds).join(", ")}`,
        );
      }

      for (const chainId of indexedChainIds) {
        const chainIndexingMetrics = ponderIndexingMetrics.chains.get(chainId);
        const chainIndexingStatus = ponderIndexingStatus.chains.get(chainId);
        const chainConfigBlockrange = chainsConfigBlockrange.get(chainId);
        const ponderCachedPublicClient = ponderCachedPublicClients.get(chainId);

        // Invariants: chain config blockrange, indexing metrics, indexing status and public client
        // must exist in proper state for the indexed chain.
        if (!chainIndexingMetrics) {
          throw new Error(`Indexing metrics must be available for indexed chain ID ${chainId}`);
        }

        if (!chainIndexingStatus) {
          throw new Error(`Indexing status must be available for indexed chain ID ${chainId}`);
        }

        if (!chainConfigBlockrange) {
          throw new Error(
            `Chain config blockrange must be available for indexed chain ID ${chainId}`,
          );
        }

        let metadataImmutable: ChainIndexingMetadataImmutable;

        // If there is no cached result, or if the cached result is an error,
        // we build the immutable metadata from scratch.
        if (cachedResult === undefined || cachedResult.result instanceof Error) {
          if (!ponderCachedPublicClient) {
            throw new Error(
              `Ponder cached public client must be available for indexed chain ID ${chainId}`,
            );
          }

          if (chainIndexingMetrics.state !== ChainIndexingStates.Historical) {
            throw new Error(
              `Chain indexing state must be "historical" for indexed chain ID ${chainId}, but got "${chainIndexingMetrics.state}"`,
            );
          }

          const backfillEndBlockNumber =
            chainConfigBlockrange.startBlock + chainIndexingMetrics.historicalTotalBlocks - 1;

          // Fetch required block references in parallel.
          const [startBlock, endBlock, backfillEndBlock] = await Promise.all([
            fetchBlockRef(ponderCachedPublicClient, chainConfigBlockrange.startBlock),
            chainConfigBlockrange.endBlock
              ? fetchBlockRef(ponderCachedPublicClient, chainConfigBlockrange.endBlock)
              : null,
            fetchBlockRef(ponderCachedPublicClient, backfillEndBlockNumber),
          ]);

          metadataImmutable = buildChainIndexingMetadataImmutable(
            startBlock,
            endBlock,
            backfillEndBlock,
          );
        } else {
          // Reuse the immutable metadata from cache, as it should not change over time.
          const chainIndexingMetadata = cachedResult.result.chainsIndexingMetadata.get(chainId);

          // Invariant: chain indexing metadata must be available in cache.
          if (!chainIndexingMetadata) {
            throw new Error(
              `Chain indexing metadata must be available in cache for indexed chain ID ${chainId}`,
            );
          }

          metadataImmutable = {
            backfillScope: chainIndexingMetadata.backfillScope,
            indexingConfig: chainIndexingMetadata.indexingConfig,
          };
        }

        const metadataDynamic = {
          indexingMetrics: chainIndexingMetrics,
          indexingStatus: chainIndexingStatus,
        } satisfies ChainIndexingMetadataDynamic;

        currentResult.chainsIndexingMetadata.set(chainId, {
          ...metadataImmutable,
          ...metadataDynamic,
        });
      }

      return currentResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[PonderAppMetadataCache]: an error occurred while loading data: ${errorMessage}`,
      );

      throw new Error(`Failed to load Ponder App Metadata cache: ${errorMessage}`);
    }
  },
  ttl: Number.POSITIVE_INFINITY,
  proactiveRevalidationInterval: 1 satisfies Duration,
}) satisfies PonderAppMetadataCache;
