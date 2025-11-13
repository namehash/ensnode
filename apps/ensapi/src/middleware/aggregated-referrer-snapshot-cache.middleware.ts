import config from "@/config";

import {
  ENS_HOLIDAY_AWARDS_END_DATE,
  ENS_HOLIDAY_AWARDS_START_DATE,
} from "@namehash/ens-referrals";

import { getEthnamesSubregistryId, staleWhileRevalidate } from "@ensnode/ensnode-sdk";

import { getAggregatedReferrerSnapshot } from "@/lib/ensanalytics/database";
import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

// SWR-cached fetcher for aggregated referrer snapshot
export const fetcher = staleWhileRevalidate(() => {
  logger.info("Building aggregated referrer snapshot...");
  const subregistryId = getEthnamesSubregistryId(config.namespace);
  const promise = getAggregatedReferrerSnapshot(
    ENS_HOLIDAY_AWARDS_START_DATE,
    ENS_HOLIDAY_AWARDS_END_DATE,
    subregistryId,
  );

  promise
    .then(() => {
      logger.info("Successfully built aggregated referrer snapshot");
    })
    .catch((error) => {
      logger.error({ error }, "Failed to build aggregated referrer snapshot");
    });

  return promise;
}, TTL_MS);

export type AggregatedReferrerSnapshotCacheVariables = {
  aggregatedReferrerSnapshotCache: Awaited<ReturnType<typeof fetcher>>;
};

/**
 * Middleware that fetches and caches aggregated referrer snapshot data.
 *
 * Retrieves all referrers with at least one qualified referral from the database and caches them for TTL_MS
 * duration to avoid excessive / slow database queries. Sets the `aggregatedReferrerSnapshotCache`
 * variable on the context for use by other middleware and handlers.
 */
export const aggregatedReferrerSnapshotCacheMiddleware = factory.createMiddleware(
  async (c, next) => {
    c.set("aggregatedReferrerSnapshotCache", await fetcher());
    await next();
  },
);
