import type { Address } from "viem";

import type {
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "./award-models/pie-split/edition-metrics";
import { buildUnrankedReferrerMetricsPieSplit } from "./award-models/pie-split/metrics";
import type {
  ReferrerEditionMetricsRankedRevShareLimit,
  ReferrerEditionMetricsUnrankedRevShareLimit,
} from "./award-models/rev-share-limit/edition-metrics";
import { buildUnrankedReferrerMetricsRevShareLimit } from "./award-models/rev-share-limit/metrics";
import { ReferrerEditionMetricsTypeIds } from "./award-models/shared/edition-metrics";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferrerLeaderboard } from "./leaderboard";
import { calcReferralProgramStatus } from "./status";

/**
 * Referrer edition metrics data for a specific referrer address on the leaderboard.
 *
 * Use `awardModel` to narrow the specific model variant at runtime.
 */
export type ReferrerEditionMetricsRanked =
  | ReferrerEditionMetricsRankedPieSplit
  | ReferrerEditionMetricsRankedRevShareLimit;

/**
 * Referrer edition metrics data for a specific referrer address NOT on the leaderboard.
 *
 * Use `awardModel` to narrow the specific model variant at runtime.
 */
export type ReferrerEditionMetricsUnranked =
  | ReferrerEditionMetricsUnrankedPieSplit
  | ReferrerEditionMetricsUnrankedRevShareLimit;

/**
 * Referrer edition metrics data for a specific referrer address.
 *
 * Use `type` to determine if the referrer is ranked or unranked.
 * Use `awardModel` to narrow the award model variant.
 */
export type ReferrerEditionMetrics = ReferrerEditionMetricsRanked | ReferrerEditionMetricsUnranked;

/**
 * Get the edition metrics for a specific referrer from the leaderboard.
 *
 * Returns a {@link ReferrerEditionMetricsRanked} if the referrer is on the leaderboard,
 * or a {@link ReferrerEditionMetricsUnranked} if the referrer has no referrals.
 *
 * @param referrer - The referrer address to look up
 * @param leaderboard - The referrer leaderboard to query
 * @returns The appropriate {@link ReferrerEditionMetrics} (ranked or unranked)
 */
export const getReferrerEditionMetrics = (
  referrer: Address,
  leaderboard: ReferrerLeaderboard,
): ReferrerEditionMetrics => {
  const status = calcReferralProgramStatus(leaderboard.rules, leaderboard.accurateAsOf);

  switch (leaderboard.awardModel) {
    case ReferralProgramAwardModels.PieSplit: {
      const awardedReferrerMetrics = leaderboard.referrers.get(referrer);
      if (awardedReferrerMetrics) {
        return {
          awardModel: leaderboard.awardModel,
          type: ReferrerEditionMetricsTypeIds.Ranked,
          rules: leaderboard.rules,
          referrer: awardedReferrerMetrics,
          aggregatedMetrics: leaderboard.aggregatedMetrics,
          status,
          accurateAsOf: leaderboard.accurateAsOf,
        } satisfies ReferrerEditionMetricsRankedPieSplit;
      }
      return {
        awardModel: leaderboard.awardModel,
        type: ReferrerEditionMetricsTypeIds.Unranked,
        rules: leaderboard.rules,
        referrer: buildUnrankedReferrerMetricsPieSplit(referrer),
        aggregatedMetrics: leaderboard.aggregatedMetrics,
        status,
        accurateAsOf: leaderboard.accurateAsOf,
      } satisfies ReferrerEditionMetricsUnrankedPieSplit;
    }

    case ReferralProgramAwardModels.RevShareLimit: {
      const awardedReferrerMetrics = leaderboard.referrers.get(referrer);
      if (awardedReferrerMetrics) {
        return {
          awardModel: leaderboard.awardModel,
          type: ReferrerEditionMetricsTypeIds.Ranked,
          rules: leaderboard.rules,
          referrer: awardedReferrerMetrics,
          aggregatedMetrics: leaderboard.aggregatedMetrics,
          status,
          accurateAsOf: leaderboard.accurateAsOf,
        } satisfies ReferrerEditionMetricsRankedRevShareLimit;
      }
      return {
        awardModel: leaderboard.awardModel,
        type: ReferrerEditionMetricsTypeIds.Unranked,
        rules: leaderboard.rules,
        referrer: buildUnrankedReferrerMetricsRevShareLimit(referrer),
        aggregatedMetrics: leaderboard.aggregatedMetrics,
        status,
        accurateAsOf: leaderboard.accurateAsOf,
      } satisfies ReferrerEditionMetricsUnrankedRevShareLimit;
    }
  }
};
