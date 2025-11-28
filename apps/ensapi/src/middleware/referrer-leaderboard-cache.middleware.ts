import config from "@/config";

import {
  buildReferralProgramRules,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";
import type { PromiseResult } from "p-reflect";
import pReflect from "p-reflect";

import {
  type Duration,
  getEthnamesSubregistryId,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { getReferrerLeaderboard } from "@/lib/ensanalytics/referrer-leaderboard";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("referrer-leaderboard-cache.middleware");

const TTL: Duration = 5 * 60; // 5 minutes

const rules = buildReferralProgramRules(
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  config.ensHolidayAwardsStart,
  config.ensHolidayAwardsEnd,
  getEthnamesSubregistryId(config.namespace),
);

const swrReferrerLeaderboardFetcher = staleWhileRevalidate({
  fn: async () => {
    logger.info(`Building referrer leaderboard with rules:\n${JSON.stringify(rules, null, 2)}`);

    try {
      const result = await getReferrerLeaderboard(rules);
      logger.info(
        `Successfully built referrer leaderboard with ${result.referrers.size} referrers from indexed data`,
      );
      return result;
    } catch (error) {
      logger.error({ error }, "Failed to build referrer leaderboard");
      throw error;
    }
  },
  ttl: TTL,
});

/**
 * Type definition for the referrer leaderboard cache middleware context passed to downstream middleware and handlers.
 */
export type ReferrerLeaderboardCacheMiddlewareVariables = {
  /**
   * The cached referrer leaderboard containing metrics and rankings for referrers.
   *
   * If `isRejected` is `true`, no referrer leaderboard has been successfully fetched and cached since service startup.
   * This may indicate the ENSIndexer service is unreachable, in an error state, or the database query failed.
   *
   * The leaderboard's `updatedAt` timestamp reflects the `slowestChainIndexingCursor` from the indexing status,
   * ensuring consistency with the indexer state rather than the current system time.
   */
  referrerLeaderboardCache: PromiseResult<ReferrerLeaderboard>;
};

/**
 * Middleware that provides {@link ReferrerLeaderboardCacheMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware uses the SWR caching strategy to serve cached data immediately (even if stale) while
 * asynchronously revalidating in the background. This provides:
 * - Sub-millisecond response times (after first fetch)
 * - Always available data (serves stale data during revalidation)
 * - Automatic background updates every TTL (5 minutes)
 *
 * Retrieves referrer leaderboard for all referrers with at least one referral within the ENS Holiday Awards period from the database and caches them.
 * Sets the `referrerLeaderboardCache` variable on the context for use by other middleware and handlers.
 *
 * Using the `slowestChainIndexingCursor` from the indexing status as the leaderboard's `updatedAt` timestamp
 * to ensure the timestamp accurately reflects the indexer state rather than the current system time.
 *
 * @see {@link staleWhileRevalidate} for detailed documentation on the SWR caching strategy and error handling.
 */
export const referrerLeaderboardCacheMiddleware = factory.createMiddleware(async (c, next) => {
  if (c.var.indexingStatus === undefined) {
    throw new Error(
      `Invariant(referrerLeaderboardCacheMiddleware): indexingStatusMiddleware required`,
    );
  }

  let promiseResult: ReferrerLeaderboardCacheMiddlewareVariables["referrerLeaderboardCache"];

  if (c.var.indexingStatus.isRejected) {
    promiseResult = await pReflect(
      Promise.reject(
        // Cached indexing status response was not available.
        new Error(
          "Unable to generate a new referrer leaderboard. Indexing status is currently unavailable to this ENSApi instance.",
          { cause: c.var.indexingStatus.reason },
        ),
      ),
    );
    c.set("referrerLeaderboardCache", promiseResult);
    return await next();
  }

  const cachedLeaderboard = await swrReferrerLeaderboardFetcher();

  if (cachedLeaderboard === null) {
    // A referrer leaderboard has never been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive
    // a `referrerLeaderboardCache` variable where `isRejected` is `true` and `reason` is the provided `error`.
    const errorMessage =
      "Unable to generate a new referrer leaderboard. No referrer leaderboards have been successfully fetched and stored into cache since service startup. This may indicate the referrer leaderboard service is unreachable or in an error state.";
    const error = new Error(errorMessage);
    logger.error(error);
    promiseResult = await pReflect(Promise.reject(error));
  } else {
    // A referrer leaderboard has been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive a
    // `referrerLeaderboardCache` variable where `isFulfilled` is `true` and `value` is a {@link ReferrerLeaderboard} value
    // generated from the `cachedLeaderboard`.
    promiseResult = await pReflect(Promise.resolve(cachedLeaderboard));
  }

  c.set("referrerLeaderboardCache", promiseResult);
  await next();
});
