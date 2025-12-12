import config from "@/config";

import {
  buildReferralProgramRules,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";
import { minutesToSeconds } from "date-fns";

import {
  getEthnamesSubregistryId,
  getLatestIndexedBlockRef,
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

const referrerLeaderboardCache = new SWRCache({
  fn: async () => {
    const indexingStatus = await indexingStatusCache.read();
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

    const latestIndexedBlockRef = getLatestIndexedBlockRef(
      indexingStatus.value,
      rules.subregistryId.chainId,
    );

    if (latestIndexedBlockRef === null) {
      throw new Error(
        `Unable to generate referrer leaderboard. Latest indexed block ref for chain ${rules.subregistryId.chainId} is null.`,
      );
    }

    logger.info(`Building referrer leaderboard with rules:\n${JSON.stringify(rules, null, 2)}`);

    try {
      const result = await getReferrerLeaderboard(rules, latestIndexedBlockRef.timestamp);
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
   * A {@link ReferrerLeaderboard} identifying the current referrer leaderboard or an {@link Error}
   * indicating failure to build the leaderboard.
   *
   * If {@link referrerLeaderboard} is an Error, no prior attempts to successfully fetch (and cache)
   * a referrer leaderboard within the lifetime of this middleware have been successful.
   *
   * If {@link referrerLeaderboard} is a ReferrerLeaderboard, a referrer leaderboard was successfully
   * fetched (and cached) at least once within the lifetime of this middleware.
   */
  referrerLeaderboard: ReferrerLeaderboard | Error;
};

/**
 * Middleware that provides {@link ReferrerLeaderboardMiddlewareVariables}
 * to downstream middleware and handlers.
 */
export const referrerLeaderboardMiddleware = factory.createMiddleware(async (c, next) => {
  const leaderboard = await referrerLeaderboardCache.read();

  if (leaderboard === null) {
    c.set(
      "referrerLeaderboard",
      new Error(
        "Unable to generate a new referrer leaderboard. No referrer leaderboards have been successfully fetched and stored into cache since service startup. This may indicate the referrer leaderboard service is unreachable or in an error state.",
      ),
    );
  } else {
    c.set("referrerLeaderboard", leaderboard.value);
  }

  await next();
});
