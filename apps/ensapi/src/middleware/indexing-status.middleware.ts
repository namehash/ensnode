import config from "@/config";

import { getUnixTime } from "date-fns";
import pReflect, { type PromiseResult } from "p-reflect";

import {
  createRealtimeIndexingStatusProjection,
  type Duration,
  ENSNodeClient,
  IndexingStatusResponseCodes,
  type RealtimeIndexingStatusProjection,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL: Duration = 5;
const REVALIDATION_INTERVAL: Duration = 10;

const swrIndexingStatusSnapshotFetcher = staleWhileRevalidate({
  fn: async () =>
    client
      .indexingStatus() // fetch a new indexing status snapshot
      .then((response) => {
        if (response.responseCode !== IndexingStatusResponseCodes.Ok) {
          // An indexing status response was successfully fetched, but the response code contained within the response was not 'ok'.
          // Therefore, throw an error to trigger the subsequent `.catch` handler.
          throw new Error("Received Indexing Status response with responseCode other than 'ok'.");
        }

        logger.info("Fetched Indexing Status to be cached");

        // The indexing status snapshot has been fetched and successfully validated for caching.
        // Therefore, return it so that this current invocation of `staleWhileRevalidate` will:
        // - Replace its currently cached value (if any) with this new value.
        // - Return this non-null value.
        return response.realtimeProjection.snapshot;
      })
      .catch((error) => {
        // Either the indexing status snapshot fetch failed, or the indexing status response was not 'ok'.
        // Therefore, throw an error so that this current invocation of `staleWhileRevalidate` will:
        // - Reject the newly fetched response (if any) such that it won't be cached.
        // - Return the most recently cached value from prior invocations, or `null` if no prior invocation successfully cached a value.
        logger.error(
          error,
          "Error occurred while fetching a new indexing status snapshot. The cached indexing status snapshot (if any) will not be updated.",
        );
        throw error;
      }),
  ttl: TTL,
  revalidationInterval: REVALIDATION_INTERVAL,
});

/**
 * Type definition for the indexing status middleware context passed to downstream middleware and handlers.
 */
export type IndexingStatusMiddlewareVariables = {
  /**
   * A {@link PromiseResult} identifying the current indexing context.
   *
   * There are two possible states for this variable:
   * 1) if `isRejected` is `true`, then:
   *     - This object is of type {@link PromiseRejectedResult} and contains a
   *       `reason` property of type `any` (should always be an {@link Error})
   *       that may contain info about why no indexing status context is available.
   *     - No prior attempts to successfully fetch (and cache) an indexing status
   *       snapshot within the lifetime of this service instance have been successful.
   * 2) if `isFulfilled` is `true` then:
   *     - This object is of type {@link PromiseFulfilledResult} and contains a
   *       `value` property of type {@link RealtimeIndexingStatusProjection}
   *       representing the current realtime projection generated from the most recently
   *       successfully fetched (and cached) indexing status snapshot.
   *     - An indexing status snapshot was successfully fetched (and cached) at least
   *       once within the lifetime of this service instance.
   */
  indexingStatus: PromiseResult<RealtimeIndexingStatusProjection>;
};

/**
 * Middleware that provides {@link IndexingStatusMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * Optimizes for low-latency and high-availability by:
 * - Managing an in-memory cache (using an efficient {@link staleWhileRevalidate} caching strategy) of the most
 *   recently successfully fetched indexing status snapshot.
 * - Automatically generates a {@link RealtimeIndexingStatusProjection} as context from the most recently
 *   successfully fetched (and cached) indexing status snapshot as of the time the middleware was invoked.
 * - Retaining the most recent successfully fetched (and cached) indexing status snapshot, such that even
 *   if the ENSIndexer service is unreachable or in an error state, the middleware will still be able to
 *   continue generating new {@link RealtimeIndexingStatusProjection} containing updated worst-case distances
 *   to downstream middleware and handlers.
 */
export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  const cachedSnapshot = await swrIndexingStatusSnapshotFetcher();

  let indexingStatus: IndexingStatusMiddlewareVariables["indexingStatus"];

  if (cachedSnapshot === null) {
    // An indexing status snapshot has never been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive
    // an `indexingStatus` variable where `isRejected` is `true` and `reason` is the provided `error`.
    const errorMessage =
      "Unable to generate a new indexing status projection. No indexing status snapshots have been successfully fetched and stored into cache since service startup. This may indicate the ENSIndexer service is unreachable or in an error state.";
    const error = new Error(errorMessage);
    logger.error(error);
    indexingStatus = await pReflect(Promise.reject(error));
  } else {
    // An indexing status snapshot has been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive an
    // `indexingStatus` variable where `isFulfilled` is `true` and `value` is a {@link RealtimeIndexingStatusProjection} value
    // generated from the `cachedSnapshot` based on the current time.
    const now = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(cachedSnapshot, now);
    indexingStatus = await pReflect(Promise.resolve(realtimeProjection));
  }

  c.set("indexingStatus", indexingStatus);
  await next();
});
