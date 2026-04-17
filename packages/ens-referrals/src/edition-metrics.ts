import type { NormalizedAddress } from "enssdk";

import type {
  ReferrerEditionMetricsPieSplit,
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "./award-models/pie-split/edition-metrics";
import { buildUnrankedReferrerMetricsPieSplit } from "./award-models/pie-split/metrics";
import { calcReferralProgramEditionStatusPieSplit } from "./award-models/pie-split/status";
import type {
  ReferrerEditionMetricsRankedRevShareCap,
  ReferrerEditionMetricsRevShareCap,
  ReferrerEditionMetricsUnrankedRevShareCap,
} from "./award-models/rev-share-cap/edition-metrics";
import { buildUnrankedReferrerMetricsRevShareCap } from "./award-models/rev-share-cap/metrics";
import { calcReferralProgramEditionStatusRevShareCap } from "./award-models/rev-share-cap/status";
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
  | ReferrerEditionMetricsRevShareCap
  | ReferrerEditionMetricsUnrecognized;

/**
 * Get the edition metrics for a specific referrer from the leaderboard.
 *
 * Returns a {@link ReferrerEditionMetricsPieSplit} or {@link ReferrerEditionMetricsRevShareCap}
 * with `type: "ranked"` if the referrer is on the leaderboard, or `type: "unranked"` otherwise.
 *
 * @param referrer - The referrer address to look up
 * @param leaderboard - The referrer leaderboard to query
 */
export const getReferrerEditionMetrics = (
  referrer: NormalizedAddress,
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

    case ReferralProgramAwardModels.RevShareCap: {
      const status = calcReferralProgramEditionStatusRevShareCap(
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
        } satisfies ReferrerEditionMetricsRankedRevShareCap;
      }
      return {
        awardModel: leaderboard.awardModel,
        type: ReferrerEditionMetricsTypeIds.Unranked,
        rules: leaderboard.rules,
        referrer: buildUnrankedReferrerMetricsRevShareCap(referrer, leaderboard.rules),
        aggregatedMetrics: leaderboard.aggregatedMetrics,
        status,
        accurateAsOf: leaderboard.accurateAsOf,
      } satisfies ReferrerEditionMetricsUnrankedRevShareCap;
    }

    default: {
      const _exhaustiveCheck: never = leaderboard;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerLeaderboard).awardModel}`,
      );
    }
  }
};
