import type { Address } from "enssdk";

import type {
  ReferrerEditionMetricsPieSplit,
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "./award-models/pie-split/edition-metrics";
import { buildUnrankedReferrerMetricsPieSplit } from "./award-models/pie-split/metrics";
import { calcReferralProgramEditionStatusPieSplit } from "./award-models/pie-split/status";
import type {
  ReferrerEditionMetricsRankedRevShareLimit,
  ReferrerEditionMetricsRevShareLimit,
  ReferrerEditionMetricsUnrankedRevShareLimit,
} from "./award-models/rev-share-limit/edition-metrics";
import { buildUnrankedReferrerMetricsRevShareLimit } from "./award-models/rev-share-limit/metrics";
import { calcReferralProgramEditionStatusRevShareLimit } from "./award-models/rev-share-limit/status";
import {
  ReferrerEditionMetricsTypeIds,
  type ReferrerEditionMetricsUnrecognized,
} from "./award-models/shared/edition-metrics";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferrerLeaderboard } from "./leaderboard";

/**
 * Referrer edition metrics data for a specific referrer address.
 *
 * Use `awardModel` to narrow the award model variant, then `type` to narrow ranked vs unranked.
 * When `awardModel` is `"unrecognized"`, the data was produced by a server running a newer
 * version — use {@link ReferrerEditionMetricsUnrecognized} to access `originalAwardModel`.
 */
export type ReferrerEditionMetrics =
  | ReferrerEditionMetricsPieSplit
  | ReferrerEditionMetricsRevShareLimit
  | ReferrerEditionMetricsUnrecognized;

/**
 * Get the edition metrics for a specific referrer from the leaderboard.
 *
 * Returns a {@link ReferrerEditionMetricsPieSplit} or {@link ReferrerEditionMetricsRevShareLimit}
 * with `type: "ranked"` if the referrer is on the leaderboard, or `type: "unranked"` otherwise.
 *
 * @param referrer - The referrer address to look up
 * @param leaderboard - The referrer leaderboard to query
 * @returns The appropriate {@link ReferrerEditionMetrics}
 */
export const getReferrerEditionMetrics = (
  referrer: Address,
  leaderboard: ReferrerLeaderboard,
): ReferrerEditionMetrics => {
  switch (leaderboard.awardModel) {
    case ReferralProgramAwardModels.PieSplit: {
      const status = calcReferralProgramEditionStatusPieSplit(
        leaderboard.rules,
        leaderboard.accurateAsOf,
      );
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
      const status = calcReferralProgramEditionStatusRevShareLimit(
        leaderboard.rules,
        leaderboard.accurateAsOf,
        leaderboard.aggregatedMetrics,
      );
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
        referrer: buildUnrankedReferrerMetricsRevShareLimit(referrer, leaderboard.rules),
        aggregatedMetrics: leaderboard.aggregatedMetrics,
        status,
        accurateAsOf: leaderboard.accurateAsOf,
      } satisfies ReferrerEditionMetricsUnrankedRevShareLimit;
    }

    default: {
      const _exhaustiveCheck: never = leaderboard;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerLeaderboard).awardModel}`,
      );
    }
  }
};
