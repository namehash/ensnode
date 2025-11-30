import config from "@/config";

import {
  buildReferralProgramRules,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";
import { minutesToSeconds } from "date-fns";
import type { PromiseResult } from "p-reflect";
import pReflect from "p-reflect";

import {
  getEthnamesSubregistryId,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { getReferrerLeaderboard } from "@/lib/ensanalytics/referrer-leaderboard";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { indexingStatusCache } from "@/middleware/indexing-status.middleware";

const logger = makeLogger("referrer-leaderboard-cache.middleware");

const rules = buildReferralProgramRules(
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  config.ensHolidayAwardsStart,
  config.ensHolidayAwardsEnd,
  getEthnamesSubregistryId(config.namespace),
);

/**
 * The list of {@link OmnichainIndexingStatusId} values that are supported for generating
 * a referrer leaderboard.
 *
 * Other values indicate that we are not ready to generate a referrer leaderboard yet.
 *
 */
const supportedOmnichainIndexingStatuses: OmnichainIndexingStatusId[] = [
  OmnichainIndexingStatusIds.Following,
  OmnichainIndexingStatusIds.Completed,
];

const referrerLeaderboardCache = await SWRCache.create({
  fn: async () => {
    const indexingStatus = await indexingStatusCache.readCache();
    if (indexingStatus === null) {
      throw new Error(
        "Unable to generate referrer leaderboard. indexingStatusCache must have been successfully initialized.",
      );
    }

    const omnichainIndexingStatus = indexingStatus.value.omnichainSnapshot.omnichainStatus;

    if (!supportedOmnichainIndexingStatuses.includes(omnichainIndexingStatus)) {
      throw new Error(
        `Unable to generate referrer leaderboard. Omnichain indexing status is currently ${omnichainIndexingStatus} but must be ${supportedOmnichainIndexingStatuses.join(" or ")} to generate a referrer leaderboard.`,
      );
    }

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
  ttl: minutesToSeconds(1),
  revalidationInterval: minutesToSeconds(2),
  proactivelyInitialize: true,
});

/**
 * Type definition for the referrer leaderboard middleware context passed to downstream middleware and handlers.
 */
export type ReferrerLeaderboardMiddlewareVariables = {
  /**
   * The referrer leaderboard containing metrics and rankings for all referrers
   * with at least one referral within the ENS Holiday Awards period.
   *
   * If `isRejected` is `true`, no referrer leaderboard has been successfully generated since service startup.
   * This may indicate the ENSIndexer service is unreachable, in an error state, or the database query failed.
   */

  /**
   * A {@link PromiseResult} identifying the current referrer leaderboard.
   *
   * There are two possible states for this variable:
   * 1) if `isRejected` is `true`, then:
   *     - This object is of type {@link PromiseRejectedResult} and contains a
   *       `reason` property of type `any` (should always be an {@link Error})
   *       that may contain info about why no leaderboard is available.
   *     - No prior attempts to successfully fetch (and cache) a referrer leaderboard
   *       within the lifetime of this service instance have been successful.
   * 2) if `isFulfilled` is `true` then:
   *     - This object is of type {@link PromiseFulfilledResult} and contains a
   *       `value` property of type {@link ReferrerLeaderboard}
   *       representing the most recently successfully fetched (and cached) referrer leaderboard.
   *     - A referrer leaderboard was successfully fetched (and cached) at least
   *       once within the lifetime of this service instance.
   */
  referrerLeaderboard: PromiseResult<ReferrerLeaderboard>;
};

/**
 * Middleware that provides {@link ReferrerLeaderboardMiddlewareVariables}
 * to downstream middleware and handlers.
 */
export const referrerLeaderboardMiddleware = factory.createMiddleware(async (c, next) => {
  const cachedLeaderboard = await referrerLeaderboardCache.readCache();

  let promiseResult: PromiseResult<ReferrerLeaderboard>;

  if (cachedLeaderboard === null) {
    // A referrer leaderboard has never been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive
    // a `referrerLeaderboard` variable where `isRejected` is `true` and `reason` is the provided `error`.
    const errorMessage =
      "Unable to generate a new referrer leaderboard. No referrer leaderboards have been successfully fetched and stored into cache since service startup. This may indicate the referrer leaderboard service is unreachable or in an error state.";
    const error = new Error(errorMessage);
    logger.error(error);
    promiseResult = await pReflect(Promise.reject(error));
  } else {
    // A referrer leaderboard has been cached successfully.
    // Build a p-reflect `PromiseResult` for downstream handlers such that they will receive a
    // `referrerLeaderboard` variable where `isFulfilled` is `true` and `value` is a {@link ReferrerLeaderboard} value
    // generated from the `cachedLeaderboard`.
    promiseResult = await pReflect(Promise.resolve(cachedLeaderboard.value));
  }

  c.set("referrerLeaderboard", promiseResult);
  await next();
});
