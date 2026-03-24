import config from "@/config";

import {
  type CrossChainIndexingStatusSnapshot,
  ENSNodeClient,
  IndexingStatusResponseCodes,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { lazy, lazyProxy } from "@/lib/lazy";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.cache");

// lazy() defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
const getClient = lazy(() => new ENSNodeClient({ url: config.ensIndexerUrl }));

type IndexingStatusCache = SWRCache<CrossChainIndexingStatusSnapshot>;

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
export const indexingStatusCache = lazyProxy<IndexingStatusCache>(
  () =>
    new SWRCache<CrossChainIndexingStatusSnapshot>({
      fn: async (_cachedResult) =>
        getClient()
          .indexingStatus() // fetch a new indexing status snapshot
          .then((response) => {
            if (response.responseCode !== IndexingStatusResponseCodes.Ok) {
              // An indexing status response was successfully fetched, but the response code contained within the response was not 'ok'.
              // Therefore, throw an error to trigger the subsequent `.catch` handler.
              throw new Error(
                "Received Indexing Status response with responseCode other than 'ok'.",
              );
            }

            logger.info("Fetched Indexing Status to be cached");

            // The indexing status snapshot has been fetched and successfully validated for caching.
            // Therefore, return it so that this current invocation of `readCache` will:
            // - Replace the currently cached value (if any) with this new value.
            // - Return this non-null value.
            return response.realtimeProjection.snapshot;
          })
          .catch((error) => {
            // Either the indexing status snapshot fetch failed, or the indexing status response was not 'ok'.
            // Therefore, throw an error so that this current invocation of `readCache` will:
            // - Reject the newly fetched response (if any) such that it won't be cached.
            // - Return the most recently cached value from prior invocations, or `null` if no prior invocation successfully cached a value.
            logger.error(
              error,
              "Error occurred while fetching a new indexing status snapshot. The cached indexing status snapshot (if any) will not be updated.",
            );
            throw error;
          }),
      ttl: 5, // 5 seconds
      proactiveRevalidationInterval: 10, // 10 seconds
      proactivelyInitialize: true,
    }),
);
