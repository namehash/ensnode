import config from "@/config";

import { getUnixTime } from "date-fns";

import {
  createRealtimeIndexingStatusProjection,
  ENSNodeClient,
  IndexingStatusResponseCodes,
  type RealtimeIndexingStatusProjection,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

export const indexingStatusCache = new SWRCache({
  fn: async () =>
    client
      .indexingStatus() // fetch a new indexing status snapshot
      .then((response) => {
        if (response.responseCode !== IndexingStatusResponseCodes.Ok) {
          // An indexing status response was successfully fetched, but the response code contained within the response was not 'ok'.
          // Therefore, throw an error to trigger the subsequent `.catch` handler.
          throw new Error("Received Indexing Status response with responseCode other than 'ok'.");
        }

        logger.info(`Indexing Status cached at: ${new Date()}`);

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
        logger.debug(
          error,
          "Error occurred while fetching a new indexing status snapshot. The cached indexing status snapshot (if any) will not be updated.",
        );
        throw error;
      }),
  ttl: 5, // 5 seconds
  revalidationInterval: 10, // 10 seconds
  proactivelyInitialize: true,
});

/**
 * Type definition for the indexing status middleware context passed to downstream middleware and handlers.
 */
export type IndexingStatusMiddlewareVariables = {
  /**
   * The current {@link RealtimeIndexingStatusProjection} or an {@link Error} indicating failure.
   *
   * If {@link indexingStatus} is an Error, no prior attempts to successfully fetch (and cache) an
   * indexing status snapshot within the lifetime of this middleware have been successful.
   *
   * If {@link indexingStatus} is a RealtimeIndexingStatusProjection, an indexing status snapshot
   * was successfully fetched (and cached) at least once within the lifetime of this middleware.
   */
  indexingStatus: RealtimeIndexingStatusProjection | Error;
};

/**
 * Middleware that provides {@link IndexingStatusMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * Optimizes for low-latency and high-availability by:
 * - Using an efficient {@link SWRCache} for managing the most recently
 *   successfully fetched (and cached) indexing status snapshot.
 * - Automatically generates a {@link RealtimeIndexingStatusProjection} as context from the most recently
 *   successfully fetched (and cached) indexing status snapshot as of the time the middleware was invoked.
 * - Retaining the most recent successfully fetched (and cached) indexing status snapshot, such that even
 *   if the ENSIndexer service is unreachable or in an error state, the middleware will still be able to
 *   continue generating new {@link RealtimeIndexingStatusProjection} containing updated worst-case distances
 *   to downstream middleware and handlers.
 */
export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  const snapshot = await indexingStatusCache.read();

  if (snapshot === null) {
    c.set(
      "indexingStatus",
      new Error(
        "Unable to generate a new indexing status projection. No indexing status snapshots have been successfully fetched and stored into cache since service startup. This may indicate the ENSIndexer service is unreachable or in an error state.",
      ),
    );
  } else {
    const now = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(snapshot.value, now);
    c.set("indexingStatus", realtimeProjection);
  }

  await next();
});
