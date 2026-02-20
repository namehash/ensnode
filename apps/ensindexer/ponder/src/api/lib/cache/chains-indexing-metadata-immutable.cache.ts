import type { PublicClient } from "viem";

import { SWRCache } from "@ensnode/ensnode-sdk";
import type { BlockrangeWithStartBlock, ChainId, PonderIndexingMetrics } from "@ensnode/ponder-sdk";

import {
  buildChainsIndexingMetadataImmutable,
  type ChainsIndexingMetadataImmutable,
} from "../chains-indexing-metadata-immutable";
import type { PonderClientCache } from "./ponder-client.cache";

/**
 * Context required to load the chains indexing metadata immutable cache.
 */
export interface ChainsIndexingMetadataImmutableCacheContext {
  indexedChainIds: Set<ChainId>;
  chainsConfigBlockrange: Map<ChainId, BlockrangeWithStartBlock>;
  publicClients: Map<ChainId, PublicClient>;
  ponderClientCache: PonderClientCache;
}

/**
 * Type of the cache for the immutable metadata of the indexed chains.
 */
export type ChainsIndexingMetadataImmutableCache = SWRCache<
  ChainsIndexingMetadataImmutable,
  ChainsIndexingMetadataImmutableCacheContext
>;

/**
 * Cache for the immutable metadata of the indexed chains.
 *
 * This cache is designed to store metadata that is expected to remain constant
 * throughout the indexing process. The metadata is built based on
 * {@link PonderIndexingMetrics} value cached in {@link PonderClientCache}.
 * There may be a few failed attempts to load this cache at the startup of
 * the Ponder app until the metrics become available. Once the data is
 * successfully loaded, the cache stops proactive revalidation since the data
 * is expected to be immutable.
 */
export const chainsIndexingMetadataImmutableCache = new SWRCache({
  fn: async function loadChainsIndexingMetadataImmutable(_cachedValue, context) {
    if (!context) {
      throw new Error(
        `ChainsIndexingMetadataImmutableCache context must be set to load Chains Indexing Metadata Immutable`,
      );
    }

    const { indexedChainIds, chainsConfigBlockrange, publicClients, ponderClientCache } = context;

    try {
      console.info(`[ChainsIndexingMetadataImmutableCache]: loading data...`);
      const ponderClientCacheResult = await ponderClientCache.read();

      // Invariant: indexing metrics must be available in cache
      if (ponderClientCacheResult instanceof Error) {
        throw new Error(
          `Ponder Indexing Metrics must be available in cache to build chains indexing metadata immutable: ${ponderClientCacheResult.message}`,
        );
      }

      const { ponderIndexingMetrics } = ponderClientCacheResult;

      const chainsIndexingMetadataImmutable = await buildChainsIndexingMetadataImmutable(
        indexedChainIds,
        chainsConfigBlockrange,
        publicClients,
        ponderIndexingMetrics,
      );

      console.info(`[ChainsIndexingMetadataImmutableCache]: Successfully loaded data`);

      // Stop the proactive revalidation of this cache since we have
      // successfully loaded the data and initialized the client state.
      chainsIndexingMetadataImmutableCache.stopProactiveRevalidation();

      return chainsIndexingMetadataImmutable;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[ChainsIndexingMetadataImmutableCache]: an error occurred while loading data: ${errorMessage}`,
      );

      throw new Error(`Failed to load Chains Indexing Metadata Immutable: ${errorMessage}`);
    }
  },
  ttl: Number.POSITIVE_INFINITY,
  proactiveRevalidationInterval: 5,
}) satisfies ChainsIndexingMetadataImmutableCache;
