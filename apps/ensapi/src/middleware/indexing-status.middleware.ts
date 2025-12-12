import { getUnixTime } from "date-fns";

import {
  createRealtimeIndexingStatusProjection,
  type RealtimeIndexingStatusProjection,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { indexingStatusCache } from "@/cache/indexing-status.cache";
import { factory } from "@/lib/hono-factory";

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
  const cachedSnapshot = await indexingStatusCache.readCache();

  if (cachedSnapshot === null) {
    // An indexing status snapshot has never been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive
    // an `indexingStatus` variable where `isRejected` is `true` and `reason` is the provided `error`.
    c.set(
      "indexingStatus",
      new Error(
        "Unable to generate a new indexing status projection. No indexing status snapshots have been successfully fetched and stored into cache since service startup. This may indicate the ENSIndexer service is unreachable or in an error state.",
      ),
    );
  } else {
    // An indexing status snapshot has been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive an
    // `indexingStatus` variable where `isFulfilled` is `true` and `value` is a {@link RealtimeIndexingStatusProjection} value
    // generated from the `cachedSnapshot` based on the current time.
    const now = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(cachedSnapshot.value, now);
    c.set("indexingStatus", realtimeProjection);
  }

  await next();
});
