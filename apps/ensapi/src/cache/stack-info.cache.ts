import { minutesToSeconds } from "date-fns";

import { EnsNodeMetadataKeys } from "@ensnode/ensdb-sdk";
import {
  buildEnsNodeStackInfo,
  type EnsNodeStackInfo,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { lazyProxy } from "@/lib/lazy";
import logger from "@/lib/logger";

export type EnsNodeStackInfoCache = SWRCache<EnsNodeStackInfo>;

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
// SWRCache with proactivelyInitialize:true starts background polling immediately
// on construction, which would trigger ensDbClient before env vars are available.
/**
 * Cache for {@link EnsNodeStackInfo}, which is loaded from ENSDb on demand.
 * Once successfully loaded, the {@link EnsNodeStackInfo} is cached and kept up-to-date
 * by proactive revalidation, since the {@link EnsNodeStackInfo} might change during
 * the lifecycle of the ENSApi instance, for example, when
 * {@link IndexingMetadataContextInitialized.stackInfo} is updated in ENSDb.
 * This is unlikely to happen at all, and if it does happen, it is likely to be
 * very infrequent. However, proactive revalidation ensures that if such changes do happen,
 * the cached value will be updated in a reasonable time frame without requiring
 * a restart of the ENSApi application.
 *
 * Configuration:
 * - ttl: 1 minute - Allow cached value to be fresh for up to 1 minute.
 * - errorTtl: 1 minute - If loading fails, retry on next access after 1 minute.
 * - proactiveRevalidationInterval: 5 minutes - Refresh the cached value every 5 minutes.
 * - proactivelyInitialize: true - Load immediately on startup
 */
export const stackInfoCache = lazyProxy<EnsNodeStackInfoCache>(
  () =>
    new SWRCache<EnsNodeStackInfo>({
      fn: async function loadEnsNodeStackInfo() {
        // Async import `di` here to avoid circular dependency between this cache module and the DI container module.
        // NOTE: It will not be required soon, as we plan to create a factory function for this cache
        // that accepts the necessary dependencies as parameters, instead of importing from the DI container.
        const di = await import("@/di").then((mod) => mod.default);
        const { ensDbClient } = di.context;

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

          const ensIndexerStackInfo = indexingMetadataContext.stackInfo;
          const ensNodeStackInfo = buildEnsNodeStackInfo(
            buildEnsApiPublicConfig(di.context.ensApiConfig, ensIndexerStackInfo.ensIndexer),
            ensIndexerStackInfo.ensDb,
            ensIndexerStackInfo.ensIndexer,
            ensIndexerStackInfo.ensRainbow,
          );

          // The EnsNodeStackInfo has been successfully built for caching.
          // Therefore, return it so that this current invocation of `readCache` will:
          // - Replace the currently cached value (if any) with this new value.
          // - Return this non-null value.
          return ensNodeStackInfo;
        } catch (error) {
          // IndexingMetadataContext was uninitialized in ENSDb.
          // Therefore, throw an error so that this current invocation of `readCache` will:
          // - Reject the newly fetched response (if any) such that it won't be cached.
          // - Return the most recently cached value from prior invocations, or `null` if no prior invocation successfully cached a value.
          logger.error(
            error,
            `Error occurred while loading Indexing Metadata Context record from ENSNode Metadata table in ENSDb. ` +
              `Where clause applied: ("ensIndexerSchemaName" = "${ensDbClient.ensIndexerSchemaName}", "key" = "${EnsNodeMetadataKeys.IndexingMetadataContext}"). ` +
              `The cached EnsNodeStackInfo object (if any) will not be updated.`,
          );

          throw error;
        }
      },
      ttl: minutesToSeconds(1),
      errorTtl: minutesToSeconds(1),
      proactiveRevalidationInterval: minutesToSeconds(5),
      proactivelyInitialize: true,
    }),
);
