import config from "@/config";

import { getUnixTime } from "date-fns";
import pReflect, { type PromiseResult } from "p-reflect";

import {
  createRealtimeIndexingStatusProjection,
  type Duration,
  ENSNodeClient,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseOk,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL: Duration = 5; // 5 seconds

export const fetcher = staleWhileRevalidate({
  fn: async () =>
    client
      .indexingStatus()
      .then((response) => {
        // reject response with responseCode other than 'ok'
        if (response.responseCode !== IndexingStatusResponseCodes.Ok) {
          throw new Error(
            "Received Indexing Status response with responseCode other than 'ok'. The cached indexing status snapshot (if any) will not be updated.",
          );
        }

        // resolve response to be cached
        return response;
      })
      .catch((error) => {
        logger.error(error, "Error occurred while fetching current indexing status.");
        // re-throw to avoid caching failed fetches
        throw error;
      }),
  ttl: TTL,
});

export type IndexingStatusVariables = {
  /**
   * Current indexing status based on the latest successfully fetched
   * indexing status response.
   *
   * There are two possible states for this variable:
   * 1) Rejected: Fetching the indexing status has never been successful.
   * 2) Fulfilled: Fetching the indexing status was successful at least once.
   *
   * Guarantees:
   * 1) `c.var.indexingStatus.isRejected` is `true` if fetching
   *    the indexing status has never been successful.
   *    In this case, `c.var.indexingStatus.reason` contains
   *    the error encountered during fetching.
   * 2) Otherwise, `c.var.indexingStatus.isFulfilled` is `true`, and
   *    `c.var.indexingStatus.value` is a {@link IndexingStatusResponseOk} value
   *    representing the realtime projection based on the last successfully
   *    fetched indexing status response.
   */
  indexingStatus: PromiseResult<IndexingStatusResponseOk>;
};

/**
 * Middleware that fetches and caches ENSIndexer indexing status.
 *
 * Retrieves the current indexing status from the configured ENSIndexer instance
 * and caches it for TTL duration to avoid excessive API calls. Sets the
 * `indexingStatus` variable on the context for use by other middleware and handlers.
 * The `indexingStatus` variable is of type `PromiseResult<IndexingStatusResponseOk>`,
 * allowing downstream handlers to handle both success and failure cases.
 */
export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  const cachedIndexingStatus = await fetcher();

  let indexingStatus: IndexingStatusVariables["indexingStatus"];

  // Wrap `cachedIndexingStatus` in p-reflect PromiseResult in order to
  // allow downstream handlers to easily distinguish between state where
  // indexing status has never been successfully cached vs where it has.
  if (cachedIndexingStatus === null) {
    // Create a rejected promise result if indexing status has never been
    // cached successfully.
    logger.error(
      "Unable to fetch current indexing status. All fetch attempts have failed since service startup and no cached status is available. This may indicate the ENSIndexer service is unreachable or not responding.",
    );
    indexingStatus = await pReflect(
      Promise.reject(new Error("Indexing Status has never been successfully cached.")),
    );
  } else {
    // Create a resolved promise result with the current realtime projection
    // based on current time and the latest successfully cached indexing status
    // snapshot.
    const now = getUnixTime(new Date());
    indexingStatus = await pReflect(
      Promise.resolve({
        ...cachedIndexingStatus,
        realtimeProjection: createRealtimeIndexingStatusProjection(
          cachedIndexingStatus.realtimeProjection.snapshot,
          now,
        ),
      }),
    );
  }

  c.set("indexingStatus", indexingStatus);
  await next();
});
