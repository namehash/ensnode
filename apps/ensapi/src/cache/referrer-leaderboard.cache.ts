import config from "@/config";

import {
  buildReferralProgramRules,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
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
import { makeLogger } from "@/lib/logger";

import { indexingStatusCache } from "./indexing-status.cache";

const logger = makeLogger("referrer-leaderboard-cache.cache");

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

export const referrerLeaderboardCache = new SWRCache({
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
