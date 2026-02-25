import { type Duration, type PriceEth, type PriceUsdc, priceEth } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "../../number";
import { validateDuration } from "../../time";
import type { AwardedReferrerMetricsRevShareLimit } from "./metrics";

/**
 * Represents aggregated metrics for a list of referrers on a rev-share-limit leaderboard.
 */
export interface AggregatedReferrerMetricsRevShareLimit {
  /**
   * @invariant The sum of `totalReferrals` across all referrers in the list.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  grandTotalReferrals: number;

  /**
   * @invariant The sum of `totalIncrementalDuration` across all referrers in the list.
   */
  grandTotalIncrementalDuration: Duration;

  /**
   * The total revenue contribution in ETH to the ENS DAO from all referrals
   * across all referrers on the leaderboard.
   *
   * This is the sum of `totalRevenueContribution` across all referrers in the list.
   *
   * @invariant Guaranteed to be a valid PriceEth with non-negative amount (>= 0n)
   */
  grandTotalRevenueContribution: PriceEth;

  /**
   * The remaining amount in the award pool after subtracting all qualified awards
   * claimed during the sequential race processing.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with non-negative amount (>= 0n)
   */
  awardPoolRemaining: PriceUsdc;
}

export const validateAggregatedReferrerMetricsRevShareLimit = (
  metrics: AggregatedReferrerMetricsRevShareLimit,
): void => {
  validateNonNegativeInteger(metrics.grandTotalReferrals);
  validateDuration(metrics.grandTotalIncrementalDuration);

  makePriceEthSchema(
    "AggregatedReferrerMetricsRevShareLimit.grandTotalRevenueContribution",
  ).parse(metrics.grandTotalRevenueContribution);

  makePriceUsdcSchema(
    "AggregatedReferrerMetricsRevShareLimit.awardPoolRemaining",
  ).parse(metrics.awardPoolRemaining);
};

/**
 * Builds aggregated rev-share-limit metrics from a complete list of referrers and
 * the award pool remaining after sequential race processing.
 *
 * **IMPORTANT: This function expects a complete list of all referrers.**
 *
 * @param referrers - Must be a complete list of referrers with their totals.
 *                    **This must NOT be a paginated or partial slice.**
 *
 * @param awardPoolRemaining - The amount remaining in the award pool after the sequential
 *                             race algorithm has processed all events.
 *
 * @returns Aggregated metrics including totals across all referrers and the award pool remaining.
 */
export const buildAggregatedReferrerMetricsRevShareLimit = (
  referrers: AwardedReferrerMetricsRevShareLimit[],
  awardPoolRemaining: PriceUsdc,
): AggregatedReferrerMetricsRevShareLimit => {
  let grandTotalReferrals = 0;
  let grandTotalIncrementalDuration = 0;
  let grandTotalRevenueContributionAmount = 0n;

  for (const referrer of referrers) {
    grandTotalReferrals += referrer.totalReferrals;
    grandTotalIncrementalDuration += referrer.totalIncrementalDuration;
    grandTotalRevenueContributionAmount += referrer.totalRevenueContribution.amount;
  }

  const aggregatedMetrics = {
    grandTotalReferrals,
    grandTotalIncrementalDuration,
    grandTotalRevenueContribution: priceEth(grandTotalRevenueContributionAmount),
    awardPoolRemaining,
  } satisfies AggregatedReferrerMetricsRevShareLimit;

  validateAggregatedReferrerMetricsRevShareLimit(aggregatedMetrics);

  return aggregatedMetrics;
};
