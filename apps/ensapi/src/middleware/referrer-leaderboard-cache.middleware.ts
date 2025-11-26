import config from "@/config";

import {
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";
import { getUnixTime } from "date-fns";
import type { PromiseResult } from "p-reflect";
import pReflect from "p-reflect";

import {
  type Duration,
  getEthnamesSubregistryId,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { getReferrerLeaderboard } from "@/lib/ensanalytics/database";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("referrer-leaderboard-cache.middleware");

const TTL: Duration = 5 * 60; // 5 minutes

export const fetcher = staleWhileRevalidate({
  fn: async () => {
    logger.info(
      `Building referrer leaderboard\n` +
        `  - ENS Holiday Awards start timestamp: ${config.ensHolidayAwardsStart}\n` +
        `  - ENS Holiday Awards end timestamp: ${config.ensHolidayAwardsEnd}`,
    );
    const subregistryId = getEthnamesSubregistryId(config.namespace);

    try {
      const result = await getReferrerLeaderboard(
        ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
        ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
        config.ensHolidayAwardsStart,
        config.ensHolidayAwardsEnd,
        subregistryId,
        // TODO: Not immediately sure of a good way to pass in a distinct / new param to this function
        // each time it's called since it's wrapped inside the staleWhileRevalidate function.
        // Therefore, temporarily use the current system time for the timestamp when the
        // referrer leaderboard is accurate as of. What we really want to do here is use the indexing
        // status middleware to set this value to `c.var.indexingStatus.value.snapshot.slowestChainIndexingCursor`.
        // If we don't fix this, we will show incorrect timestamps for when the referrer leaderboard was last
        // updated. This will especially be a noticable issue if the indexing status is far from realtime.
        getUnixTime(new Date()),
      );
      logger.info(
        {
          grandTotalReferrals: result.referrers.size,
          maxQualifiedReferrers: ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
        },
        "Successfully built referrer leaderboard",
      );
      return result;
    } catch (error) {
      logger.error({ error }, "Failed to build referrer leaderboard");
      throw error;
    }
  },
  ttl: TTL,
});

export type ReferrerLeaderboardCacheMiddlewareVariables = {
  referrerLeaderboardCache: PromiseResult<ReferrerLeaderboard>;
};

/**
 * Middleware that fetches and caches a referrer leaderboard using Stale-While-Revalidate (SWR) caching.
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
        new Error(
          "Unable to generate a new referrer leaderboard. Indexing status is currently unavailable to this ENSApi instance.",
        ),
      ),
    );
    c.set("referrerLeaderboardCache", promiseResult);
    return await next();
  }

  const cachedLeaderboard = await fetcher();

  if (cachedLeaderboard === null) {
    // A referrer leaderboard has never been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive
    // an `referrerLeaderboardCache` variable where `isRejected` is `true` and `reason` is the provided `error`.
    const errorMessage =
      "Unable to generate a new referrer leaderboard. No referrer leaderboards have been successfully fetched and stored into cache since service startup. This may indicate the referrer leaderboard service is unreachable or in an error state.";
    const error = new Error(errorMessage);
    logger.error(error);
    promiseResult = await pReflect(Promise.reject(error));
  } else {
    // A referrer leaderboard has been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive an
    // `referrerLeaderboardCache` variable where `isFulfilled` is `true` and `value` is a {@link ReferrerLeaderboard} value
    // generated from the `cachedLeaderboard`.
    promiseResult = await pReflect(Promise.resolve(cachedLeaderboard));
  }

  c.set("referrerLeaderboardCache", promiseResult);
  await next();
});
