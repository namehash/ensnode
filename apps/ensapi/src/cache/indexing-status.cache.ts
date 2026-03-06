import { type CrossChainIndexingStatusSnapshot, SWRCache } from "@ensnode/ensnode-sdk";

import { ensDbClient } from "@/lib/ensdb-client/singleton";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.cache");

export const indexingStatusCache = new SWRCache<CrossChainIndexingStatusSnapshot>({
  fn: async (_cachedResult) =>
    ensDbClient
      .getIndexingStatusSnapshot() // get the latest indexing status snapshot
      .then((snapshot) => {
        if (snapshot === undefined) {
          // An indexing status snapshot has not been found in ENSDb yet.
          // This might happen during application startup, i.e. when ENSDb
          // has not yet been populated with the first snapshot.
          // Therefore, throw an error to trigger the subsequent `.catch` handler.
          throw new Error("Indexing Status snapshot not found in ENSDb yet.");
        }

        logger.info("Fetched Indexing Status to be cached");

        // The indexing status snapshot has been fetched and successfully validated for caching.
        // Therefore, return it so that this current invocation of `readCache` will:
        // - Replace the currently cached value (if any) with this new value.
        // - Return this non-null value.
        return snapshot;
      })
      .catch((error) => {
        // Either the indexing status snapshot fetch failed, or the indexing status snapshot was not found in ENSDb yet.
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
});
