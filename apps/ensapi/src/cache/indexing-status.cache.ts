import { EnsNodeMetadataKeys } from "@ensnode/ensdb-sdk";
import {
  type CrossChainIndexingStatusSnapshot,
  IndexingMetadataContextStatusCodes,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { ensDbClient } from "@/lib/ensdb/singleton";
import { lazyProxy } from "@/lib/lazy";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.cache");

export type IndexingStatusCache = SWRCache<CrossChainIndexingStatusSnapshot>;

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
// SWRCache with proactivelyInitialize:true starts background polling immediately
// on construction, which would trigger ensDbClient before env vars are available.
/**
 * Cache for {@link CrossChainIndexingStatusSnapshot}, which is loaded
 * from ENSDb on demand. The cached value is expected to be updated
 * very frequently, following the update frequency of
 * {@link IndexingMetadataContextInitialized.indexingStatus} in ENSDb.
 * Therefore, the cache is configured with a very short TTL and
 * proactive revalidation interval to ensure that the cached value is
 * as fresh as possible.
 */
export const indexingStatusCache = lazyProxy<IndexingStatusCache>(
  () =>
    new SWRCache<CrossChainIndexingStatusSnapshot>({
      fn: async function loadIndexingStatusSnapshot() {
        try {
          const indexingMetadataContext = await ensDbClient.getIndexingMetadataContext();

          if (
            indexingMetadataContext.statusCode !== IndexingMetadataContextStatusCodes.Initialized
          ) {
            // The IndexingMetadataContext has not been initialized in ENSDb yet.
            // This might happen during application startup, i.e. when ENSDb
            // has not yet been populated with the IndexingMetadataContext record.
            // Therefore, throw an error to trigger the subsequent catch handler.
            throw new Error("Indexing Metadata Context was uninitialized in ENSDb.");
          }

          // The CrossChainIndexingStatusSnapshot has been successfully built for caching.
          // Therefore, return it so that this current invocation of `readCache` will:
          // - Replace the currently cached value (if any) with this new value.
          // - Return this non-null value.
          return indexingMetadataContext.indexingStatus;
        } catch (error) {
          // IndexingMetadataContext was uninitialized in ENSDb.
          // Therefore, throw an error so that this current invocation of `readCache` will:
          // - Reject the newly fetched response (if any) such that it won't be cached.
          // - Return the most recently cached value from prior invocations, or `null` if no prior invocation successfully cached a value.
          logger.error(
            error,
            `Error occurred while loading Indexing Metadata Context record from ENSNode Metadata table in ENSDb. ` +
              `Where clause applied: ("ensIndexerSchemaName" = "${ensDbClient.ensIndexerSchemaName}", "key" = "${EnsNodeMetadataKeys.IndexingMetadataContext}"). ` +
              `The cached indexing status snapshot (if any) will not be updated.`,
          );
          throw error;
        }
      },
      // We need to refresh the indexing status cache very frequently.
      // ENSDb won't have issues handling this frequency of queries.
      ttl: 1, // 1 second
      proactiveRevalidationInterval: 1, // 1 second
      proactivelyInitialize: true,
    }),
);
