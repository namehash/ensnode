import config from "@/config";

import {
  ENS_HOLIDAY_AWARDS_END_DATE,
  ENS_HOLIDAY_AWARDS_START_DATE,
} from "@namehash/ens-referrals";

import {
  type Duration,
  getEthnamesSubregistryId,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { getAggregatedReferrerSnapshot } from "@/lib/ensanalytics/database";
import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";

const TTL: Duration = 5 * 60; // 5 minutes

export const fetcher = staleWhileRevalidate(async () => {
  logger.info("Building aggregated referrer snapshot...");
  const subregistryId = getEthnamesSubregistryId(config.namespace);

  try {
    const result = await getAggregatedReferrerSnapshot(
      ENS_HOLIDAY_AWARDS_START_DATE,
      ENS_HOLIDAY_AWARDS_END_DATE,
      subregistryId,
    );
    logger.info("Successfully built aggregated referrer snapshot");
    return result;
  } catch (error) {
    logger.error({ error }, "Failed to build aggregated referrer snapshot");
    throw error;
  }
}, TTL);

export type AggregatedReferrerSnapshotCacheVariables = {
  aggregatedReferrerSnapshotCache: Awaited<ReturnType<typeof fetcher>>;
};

/**
 * Middleware that fetches and caches aggregated referrer snapshot data using Stale-While-Revalidate (SWR) caching.
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
 * @see {@link staleWhileRevalidate} for detailed documentation on the SWR caching strategy and error handling.
 */
export const aggregatedReferrerSnapshotCacheMiddleware = factory.createMiddleware(
  async (c, next) => {
    c.set("aggregatedReferrerSnapshotCache", await fetcher());
    await next();
  },
);
