import config from "@/config";

import {
  buildReferralProgramRules,
  ENS_HOLIDAY_AWARDS_END_DATE,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_START_DATE,
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
import { lazyProxy } from "@/lib/lazy";
import { makeLogger } from "@/lib/logger";

import { indexingStatusCache } from "./indexing-status.cache";

const logger = makeLogger("referrer-leaderboard-cache.cache");

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
const rules = lazyProxy(() =>
  buildReferralProgramRules(
    ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
    ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
    ENS_HOLIDAY_AWARDS_START_DATE,
    ENS_HOLIDAY_AWARDS_END_DATE,
    getEthnamesSubregistryId(config.namespace),
  ),
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

type ReferrerLeaderboardCache = SWRCache<ReferrerLeaderboard>;

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
export const referrerLeaderboardCache = lazyProxy<ReferrerLeaderboardCache>(
  () =>
    new SWRCache<ReferrerLeaderboard>({
      fn: async (_cachedResult) => {
        const indexingStatus = await indexingStatusCache.read();
        if (indexingStatus instanceof Error) {
          throw new Error(
            "Unable to generate referrer leaderboard. indexingStatusCache must have been successfully initialized.",
          );
        }

        const omnichainIndexingStatus = indexingStatus.omnichainSnapshot.omnichainStatus;
        if (!supportedOmnichainIndexingStatuses.includes(omnichainIndexingStatus)) {
          throw new Error(
            `Unable to generate referrer leaderboard. Omnichain indexing status is currently ${omnichainIndexingStatus} but must be ${supportedOmnichainIndexingStatuses.join(" or ")} to generate a referrer leaderboard.`,
          );
        }

        const latestIndexedBlockRef = getLatestIndexedBlockRef(
          indexingStatus,
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
      proactiveRevalidationInterval: minutesToSeconds(2),
      proactivelyInitialize: true,
    }),
);
