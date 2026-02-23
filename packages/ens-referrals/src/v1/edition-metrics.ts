import type { Address } from "viem";

import type {
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "./award-models/pie-split/edition-metrics";
import type { ReferrerLeaderboardPieSplit } from "./award-models/pie-split/leaderboard";
import { buildUnrankedReferrerMetricsPieSplit } from "./award-models/pie-split/metrics";
import type {
  ReferrerEditionMetricsRankedRevShareLimit,
  ReferrerEditionMetricsUnrankedRevShareLimit,
} from "./award-models/rev-share-limit/edition-metrics";
import type { ReferrerLeaderboardRevShareLimit } from "./award-models/rev-share-limit/leaderboard";
import { buildUnrankedReferrerMetricsRevShareLimit } from "./award-models/rev-share-limit/metrics";
import { ReferrerEditionMetricsTypeIds } from "./award-models/shared/edition-metrics";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferrerLeaderboard } from "./leaderboard";
import { calcReferralProgramStatus } from "./status";

/**
 * Referrer edition metrics data for a specific referrer address on the leaderboard.
 *
 * Use `rules.awardModel` to determine the specific model variant at runtime.
 */
export type ReferrerEditionMetricsRanked =
  | ReferrerEditionMetricsRankedPieSplit
  | ReferrerEditionMetricsRankedRevShareLimit;

/**
 * Referrer edition metrics data for a specific referrer address NOT on the leaderboard.
 *
 * Use `rules.awardModel` to determine the specific model variant at runtime.
 */
export type ReferrerEditionMetricsUnranked =
  | ReferrerEditionMetricsUnrankedPieSplit
  | ReferrerEditionMetricsUnrankedRevShareLimit;

/**
 * Referrer edition metrics data for a specific referrer address.
 *
 * Use the `type` field to determine if the referrer is ranked or unranked.
 * Use `rules.awardModel` to determine the award model variant.
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

  switch (leaderboard.rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit: {
      // Single type assertion per branch: rules.awardModel === "pie-split" guarantees the leaderboard
      // is ReferrerLeaderboardPieSplit, but TypeScript cannot narrow a union on a nested property.
      const typedLeaderboard = leaderboard as ReferrerLeaderboardPieSplit;
      const awardedReferrerMetrics = typedLeaderboard.referrers.get(referrer);
      if (awardedReferrerMetrics) {
        return {
          type: ReferrerEditionMetricsTypeIds.Ranked,
          rules: typedLeaderboard.rules,
          referrer: awardedReferrerMetrics,
          aggregatedMetrics: typedLeaderboard.aggregatedMetrics,
          status,
          accurateAsOf: leaderboard.accurateAsOf,
        } satisfies ReferrerEditionMetricsRankedPieSplit;
      }
      return {
        type: ReferrerEditionMetricsTypeIds.Unranked,
        rules: typedLeaderboard.rules,
        referrer: buildUnrankedReferrerMetricsPieSplit(referrer),
        aggregatedMetrics: typedLeaderboard.aggregatedMetrics,
        status,
        accurateAsOf: leaderboard.accurateAsOf,
      } satisfies ReferrerEditionMetricsUnrankedPieSplit;
    }

    case ReferralProgramAwardModels.RevShareLimit: {
      const typedLeaderboard = leaderboard as ReferrerLeaderboardRevShareLimit;
      const awardedReferrerMetrics = typedLeaderboard.referrers.get(referrer);
      if (awardedReferrerMetrics) {
        return {
          type: ReferrerEditionMetricsTypeIds.Ranked,
          rules: typedLeaderboard.rules,
          referrer: awardedReferrerMetrics,
          aggregatedMetrics: typedLeaderboard.aggregatedMetrics,
          status,
          accurateAsOf: leaderboard.accurateAsOf,
        } satisfies ReferrerEditionMetricsRankedRevShareLimit;
      }
      return {
        type: ReferrerEditionMetricsTypeIds.Unranked,
        rules: typedLeaderboard.rules,
        referrer: buildUnrankedReferrerMetricsRevShareLimit(referrer),
        aggregatedMetrics: typedLeaderboard.aggregatedMetrics,
        status,
        accurateAsOf: leaderboard.accurateAsOf,
      } satisfies ReferrerEditionMetricsUnrankedRevShareLimit;
    }
  }
};
