import { validateNonNegativeInteger } from "./number";
import type { RankedReferrerMetrics } from "./referrer-metrics";
import { type ReferrerScore, validateReferrerScore } from "./score";
import { type Duration, validateDuration } from "./time";

/**
 * Represents aggregated metrics for a list of `RankedReferrerMetrics`.
 */
export interface AggregatedReferrerMetrics {
  /**
   * @invariant The sum of `totalReferrals` across all `RankedReferrerMetrics` in the list.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  grandTotalReferrals: number;

  /**
   * @invariant The sum of `totalIncrementalDuration` across all `RankedReferrerMetrics` in the list.
   */
  grandTotalIncrementalDuration: Duration;

  /**
   * @invariant The sum of `finalScore` across all `RankedReferrerMetrics` where `isQualified` is `true`.
   */
  grandTotalQualifiedReferrersFinalScore: ReferrerScore;
}

export const validateAggregatedReferrerMetrics = (metrics: AggregatedReferrerMetrics): void => {
  validateNonNegativeInteger(metrics.grandTotalReferrals);
  validateDuration(metrics.grandTotalIncrementalDuration);
  validateReferrerScore(metrics.grandTotalQualifiedReferrersFinalScore);
};

export const buildAggregatedReferrerMetrics = (
  referrers: RankedReferrerMetrics[],
): AggregatedReferrerMetrics => {
  const grandTotalReferrals = referrers.reduce((sum, referrer) => sum + referrer.totalReferrals, 0);

  const grandTotalIncrementalDuration = referrers.reduce(
    (sum, referrer) => sum + referrer.totalIncrementalDuration,
    0,
  );

  const grandTotalQualifiedReferrersFinalScore = referrers.reduce((sum, referrer) => {
    if (!referrer.isQualified) return sum;
    return sum + referrer.finalScore;
  }, 0);

  const result = {
    grandTotalReferrals,
    grandTotalIncrementalDuration,
    grandTotalQualifiedReferrersFinalScore,
  };

  validateAggregatedReferrerMetrics(result);

  return result;
};
