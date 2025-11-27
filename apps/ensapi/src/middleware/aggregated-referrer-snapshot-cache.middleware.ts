import config from "@/config";

import {
  type Duration,
  ENSNodeClient,
  getEthnamesSubregistryId,
  IndexingStatusResponseCodes,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { getAggregatedReferrerSnapshot } from "@/lib/ensanalytics/database";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("aggregated-referrer-snapshot-cache.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL: Duration = 5 * 60; // 5 minutes

const swrAggregatedReferrerSnapshotFetcher = staleWhileRevalidate({
  fn: async () => {
    logger.info(
      `Building aggregated referrer snapshot\n` +
        `  - ENS Holiday Awards start timestamp: ${config.ensHolidayAwardsStart}\n` +
        `  - ENS Holiday Awards end timestamp: ${config.ensHolidayAwardsEnd}`,
    );

    // Fetch the indexing status to get the slowest chain indexing cursor.
    // This ensures the snapshot's updatedAt timestamp reflects the actual indexed data state
    // rather than the current system time, preventing issues with clock skew.
    return client
      .indexingStatus()
      .then((indexingStatusResponse) => {
        if (indexingStatusResponse.responseCode !== IndexingStatusResponseCodes.Ok) {
          // An indexing status response was successfully fetched, but the response code contained within the response was not 'ok'.
          // Therefore, throw an error to trigger the subsequent `.catch` handler.
          throw new Error(
            `Received Indexing Status response with responseCode other than 'ok': ${indexingStatusResponse.responseCode}`,
          );
        }

        // Extract the slowest chain indexing cursor from the response.
        // This represents the timestamp of the "slowest" latest indexed block across all indexed chains.
        const slowestChainIndexingCursor =
          indexingStatusResponse.realtimeProjection.snapshot.slowestChainIndexingCursor;

        logger.info(
          { slowestChainIndexingCursor },
          "Using slowestChainIndexingCursor for aggregated referrer snapshot updatedAt",
        );

        const subregistryId = getEthnamesSubregistryId(config.namespace);

        // Build the aggregated referrer snapshot from the database using the slowestChainIndexingCursor
        // as the updatedAt timestamp to ensure consistency with the indexed data state.
        return getAggregatedReferrerSnapshot(
          config.ensHolidayAwardsStart,
          config.ensHolidayAwardsEnd,
          subregistryId,
          slowestChainIndexingCursor,
        );
      })
      .then((snapshot) => {
        // The aggregated referrer snapshot has been fetched and successfully validated for caching.
        // Therefore, return it so that this current invocation of `staleWhileRevalidate` will:
        // - Replace its currently cached value (if any) with this new value.
        // - Return this non-null value.
        logger.info(
          { grandTotalReferrals: snapshot.referrers.size, updatedAt: snapshot.updatedAt },
          "Successfully built aggregated referrer snapshot",
        );
        return snapshot;
      })
      .catch((error) => {
        // Either the indexing status snapshot fetch failed, the aggregated referrer snapshot fetch failed,
        // or the indexing status response was not 'ok'.
        // Therefore, throw an error so that this current invocation of `staleWhileRevalidate` will:
        // - Reject the newly fetched response (if any) such that it won't be cached.
        // - Return the most recently cached value from prior invocations, or `null` if no prior invocation successfully cached a value.
        logger.error(
          error,
          "Error occurred while fetching a new aggregated referrer snapshot. The cached aggregated referrer snapshot (if any) will not be updated.",
        );
        throw error;
      });
  },
  ttl: TTL,
});

/**
 * Type definition for the aggregated referrer snapshot cache middleware context passed to downstream middleware and handlers.
 */
export type AggregatedReferrerSnapshotCacheMiddlewareVariables = {
  /**
   * The cached aggregated referrer snapshot containing metrics for all referrers with at least one qualified referral.
   *
   * If `null`, no aggregated referrer snapshot has been successfully fetched and cached since service startup.
   * This may indicate the ENSIndexer service is unreachable, in an error state, or the database query failed.
   *
   * The snapshot's `updatedAt` timestamp reflects the `slowestChainIndexingCursor` from the indexing status,
   * ensuring consistency with the indexer state rather than the current system time.
   */
  aggregatedReferrerSnapshotCache: Awaited<ReturnType<typeof swrAggregatedReferrerSnapshotFetcher>>;
};

/**
 * Middleware that provides {@link AggregatedReferrerSnapshotCacheMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware uses the SWR caching strategy to serve cached data immediately (even if stale) while
 * asynchronously revalidating in the background. This provides:
 * - Sub-millisecond response times (after first fetch)
 * - Always available data (serves stale data during revalidation)
 * - Automatic background updates every TTL (5 minutes)
 *
 * Retrieves all referrers with at least one qualified referral from the database and caches them.
 * Sets the `aggregatedReferrerSnapshotCache` variable on the context for use by other middleware and handlers.
 *
 * Using the `slowestChainIndexingCursor` from the indexing status as the snapshot's `updatedAt` timestamp
 * to ensure the timestamp accurately reflects the indexer state rather than the current system time.
 *
 * @see {@link staleWhileRevalidate} for detailed documentation on the SWR caching strategy and error handling.
 */
export const aggregatedReferrerSnapshotCacheMiddleware = factory.createMiddleware(
  async (c, next) => {
    const cachedSnapshot = await swrAggregatedReferrerSnapshotFetcher();
    c.set("aggregatedReferrerSnapshotCache", cachedSnapshot);
    await next();
  },
);
