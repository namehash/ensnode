import config from "@/config";

import type { PublicClient } from "viem";

import { type Duration, SWRCache } from "@ensnode/ensnode-sdk";
import {
  type BlockRef,
  type BlockrangeWithStartBlock,
  type ChainId,
  type ChainIndexingMetricsHistorical,
  ChainIndexingStates,
  PonderClient,
} from "@ensnode/ponder-sdk";

import type {
  ChainIndexingMetadata,
  ChainIndexingMetadataDynamic,
  ChainIndexingMetadataImmutable,
} from "@/lib/indexing-status-builder/chain-indexing-metadata";

import { buildChainsBlockrange } from "../chains-config-blockrange";
import { buildChainIndexingMetadataImmutable } from "../chains-indexing-metadata-immutable";
import { fetchBlockRef } from "../fetch-block-ref";
import { buildPonderCachedPublicClients } from "../ponder-cached-public-clients";

/**
 * Fetch required block references for building immutable indexing metadata for
 * a chain.
 */
async function fetchChainIndexingBlockRefs(
  chainConfigBlockrange: BlockrangeWithStartBlock,
  chainIndexingMetrics: ChainIndexingMetricsHistorical,
  ponderCachedPublicClient: PublicClient,
): Promise<{ startBlock: BlockRef; endBlock: BlockRef | null; backfillEndBlock: BlockRef }> {
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

  return { startBlock, endBlock, backfillEndBlock };
}

/**
 * Metadata from a Ponder app.
 */
export interface PonderAppMetadata {
  /**
   * Complete indexing metadata for all indexed chains.
   */
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

      const chainIdsFromMetrics = new Set(ponderIndexingMetrics.chains.keys());

      // Invariant: ponderIndexingMetrics must cover all chains indexed by ENSIndexer
      // config and must not include any chain that is not indexed.
      if (chainIdsFromMetrics.symmetricDifference(indexedChainIds).size > 0) {
        throw new Error(
          `Ponder indexing metrics must be available for all indexed chains. Indexed chain IDs from ENSIndexer config: ${Array.from(config.indexedChainIds).join(", ")}, Chain IDs with metrics: ${Array.from(chainIdsFromMetrics).join(", ")}`,
        );
      }

      const chainIdsFromStatus = new Set(ponderIndexingStatus.chains.keys());

      // Invariant: ponderIndexingStatus must cover all chains indexed by ENSIndexer
      // config and must not include any chain that is not indexed.
      if (chainIdsFromStatus.symmetricDifference(indexedChainIds).size > 0) {
        throw new Error(
          `Ponder indexing status must be available for all indexed chains. Indexed chain IDs from ENSIndexer config: ${Array.from(config.indexedChainIds).join(", ")}, Chain IDs with status: ${Array.from(chainIdsFromStatus).join(", ")}`,
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

        const metadataDynamic = {
          indexingMetrics: chainIndexingMetrics,
          indexingStatus: chainIndexingStatus,
        } satisfies ChainIndexingMetadataDynamic;

        let metadataImmutable: ChainIndexingMetadataImmutable;

        // Fetch relevant block refs from RPCs and build the immutable metadata
        // for the chain if, and only if, a successfully cached result is
        // not available yet.
        if (cachedResult === undefined || cachedResult.result instanceof Error) {
          // Invariant: Ponder cached public client must be available
          if (!ponderCachedPublicClient) {
            throw new Error(
              `Ponder cached public client must be available for indexed chain ID ${chainId}`,
            );
          }

          // Invariant: chain indexing state must be "historical" in order to
          // build immutable metadata for the chain.
          if (chainIndexingMetrics.state !== ChainIndexingStates.Historical) {
            throw new Error(
              `Chain indexing state must be "historical" for indexed chain ID ${chainId}, but got "${chainIndexingMetrics.state}"`,
            );
          }

          const { startBlock, endBlock, backfillEndBlock } = await fetchChainIndexingBlockRefs(
            chainConfigBlockrange,
            chainIndexingMetrics,
            ponderCachedPublicClient,
          );

          metadataImmutable = buildChainIndexingMetadataImmutable(
            startBlock,
            endBlock,
            backfillEndBlock,
          );
        } else {
          // Reuse the chain indexing metadata from cache
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
