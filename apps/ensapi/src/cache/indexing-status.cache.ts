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

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
// SWRCache with proactivelyInitialize:true starts background polling immediately
// on construction, which would trigger ensDbClient before env vars are available.
export const indexingStatusCache = lazyProxy<SWRCache<CrossChainIndexingStatusSnapshot>>(
  () =>
    new SWRCache<CrossChainIndexingStatusSnapshot>({
      fn: async (_cachedResult) =>
        ensDbClient
          .getIndexingMetadataContext() // get the latest indexing status snapshot
          .then((indexingMetadataContext) => {
            if (
              indexingMetadataContext.statusCode !== IndexingMetadataContextStatusCodes.Initialized
            ) {
              // The Indexing Metadata Context has not been initialized in ENSDb yet.
              // This might happen during application startup, i.e. when ENSDb
              // has not yet been populated with the first snapshot.
              // Therefore, throw an error to trigger the subsequent `.catch` handler.
              throw new Error("Indexing Metadata Context was uninitialized in ENSDb.");
            }

            // The indexing status snapshot has been fetched and successfully validated for caching.
            // Therefore, return it so that this current invocation of `readCache` will:
            // - Replace the currently cached value (if any) with this new value.
            // - Return this non-null value.
            return indexingMetadataContext.indexingStatus;
          })
          .catch((error) => {
            // Indexing Metadata Context was uninitialized in ENSDb.
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
          }),
      // We need to refresh the indexing status cache very frequently.
      // ENSDb won't have issues handling this frequency of queries.
      ttl: 1, // 1 second
      proactiveRevalidationInterval: 1, // 1 second
      proactivelyInitialize: true,
    }),
);
