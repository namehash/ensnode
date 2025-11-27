import config from "@/config";

import {
  type Duration,
  getEthnamesSubregistryId,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { getAggregatedReferrerSnapshot } from "@/lib/ensanalytics/database";
import type { AggregatedReferrerSnapshot } from "@/lib/ensanalytics/types";
import { factory, type MiddlewareVariables } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("aggregated-referrer-snapshot-cache.middleware");

const TTL: Duration = 5 * 60; // 5 minutes

export const buildSwrAggregatedReferrerSnapshotFetcher = (
  indexingStatus: MiddlewareVariables["indexingStatus"],
) =>
  staleWhileRevalidate({
    fn: async () => {
      logger.info(
        `Building aggregated referrer snapshot\n` +
          `  - ENS Holiday Awards start timestamp: ${config.ensHolidayAwardsStart}\n` +
          `  - ENS Holiday Awards end timestamp: ${config.ensHolidayAwardsEnd}`,
      );
      const subregistryId = getEthnamesSubregistryId(config.namespace);

      try {
        if (indexingStatus.isRejected) {
          // Cached indexing status response was not available.
          // Therefore, throw an error to trigger the subsequent `.catch` handler.
          throw indexingStatus.reason;
        }

        const { slowestChainIndexingCursor } = indexingStatus.value.snapshot;
        const result = await getAggregatedReferrerSnapshot(
          config.ensHolidayAwardsStart,
          config.ensHolidayAwardsEnd,
          subregistryId,
          slowestChainIndexingCursor,
        );
        logger.info(
          { grandTotalReferrals: result.referrers.size },
          "Successfully built aggregated referrer snapshot",
        );
        return result;
      } catch (error) {
        logger.error({ error }, "Failed to build aggregated referrer snapshot");
        throw error;
      }
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
  aggregatedReferrerSnapshotCache: AggregatedReferrerSnapshot | null;
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
    if (c.var.indexingStatus === undefined) {
      throw new Error(
        `Invariant("aggregated-referrer-snapshot-cache.middleware): indexingStatusMiddleware required`,
      );
    }

    const swrAggregatedReferrerSnapshotFetcher = buildSwrAggregatedReferrerSnapshotFetcher(
      c.var.indexingStatus,
    );
    const cachedSnapshot = await swrAggregatedReferrerSnapshotFetcher();

    c.set("aggregatedReferrerSnapshotCache", cachedSnapshot);
    await next();
  },
);
