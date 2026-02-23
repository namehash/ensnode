import {
  type Duration,
  type PriceEth,
  type PriceUsdc,
  priceEth,
  priceUsdc,
  scalePrice,
} from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "../../number";
import { validateDuration } from "../../time";
import type { RankedReferrerMetricsRevShareLimit } from "./metrics";
import type { ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * Represents aggregated metrics for a list of {@link RankedReferrerMetricsRevShareLimit}.
 */
export interface AggregatedReferrerMetricsRevShareLimit {
  /**
   * @invariant The sum of `totalReferrals` across all {@link RankedReferrerMetricsRevShareLimit} in the list.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  grandTotalReferrals: number;

  /**
   * @invariant The sum of `totalIncrementalDuration` across all {@link RankedReferrerMetricsRevShareLimit} in the list.
   */
  grandTotalIncrementalDuration: Duration;

  /**
   * The total revenue contribution in ETH to the ENS DAO from all referrals
   * across all referrers on the leaderboard.
   *
   * This is the sum of `totalRevenueContribution` across all {@link RankedReferrerMetricsRevShareLimit} in the list.
   *
   * @invariant Guaranteed to be a valid PriceEth with non-negative amount (>= 0n)
   */
  grandTotalRevenueContribution: PriceEth;

  /**
   * The remaining amount in the award pool after subtracting the total potential awards
   * (capped at 0 if total potential awards exceed the pool).
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

  const priceEthSchema = makePriceEthSchema(
    "AggregatedReferrerMetricsRevShareLimit.grandTotalRevenueContribution",
  );
  const parseResultEth = priceEthSchema.safeParse(metrics.grandTotalRevenueContribution);
  if (!parseResultEth.success) {
    throw new Error(
      `AggregatedReferrerMetricsRevShareLimit: grandTotalRevenueContribution validation failed: ${parseResultEth.error.message}`,
    );
  }

  const priceUsdcSchema = makePriceUsdcSchema(
    "AggregatedReferrerMetricsRevShareLimit.awardPoolRemaining",
  );
  const parseResultUsdc = priceUsdcSchema.safeParse(metrics.awardPoolRemaining);
  if (!parseResultUsdc.success) {
    throw new Error(
      `AggregatedReferrerMetricsRevShareLimit: awardPoolRemaining validation failed: ${parseResultUsdc.error.message}`,
    );
  }
};

/**
 * Builds aggregated rev-share-limit metrics from a complete, globally ranked list of referrers.
 *
 * **IMPORTANT: This function expects a complete ranking of all referrers.**
 *
 * @param referrers - Must be a complete, globally ranked list of {@link RankedReferrerMetricsRevShareLimit}
 *                    where ranks start at 1 and are consecutive.
 *                    **This must NOT be a paginated or partial slice of the rankings.**
 *
 * @param rules - The {@link ReferralProgramRulesRevShareLimit} object that define qualification criteria.
 *
 * @returns Aggregated metrics including totals across all referrers and the award pool remaining.
 *
 * @remarks
 * - If you need to work with paginated data, aggregate the full ranking first before
 *   calling this function, or call this function on the complete dataset and then paginate
 *   the results.
 */
export const buildAggregatedReferrerMetricsRevShareLimit = (
  referrers: RankedReferrerMetricsRevShareLimit[],
  rules: ReferralProgramRulesRevShareLimit,
): { aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit; scalingFactor: number } => {
  let grandTotalReferrals = 0;
  let grandTotalIncrementalDuration = 0;
  let grandTotalRevenueContributionAmount = 0n;
  let totalPotentialAwardsAmount = 0n;

  for (const referrer of referrers) {
    grandTotalReferrals += referrer.totalReferrals;
    grandTotalIncrementalDuration += referrer.totalIncrementalDuration;
    grandTotalRevenueContributionAmount += referrer.totalRevenueContribution.amount;
    if (referrer.isQualified) {
      const potentialAward = scalePrice(
        referrer.totalBaseRevenueContribution,
        rules.qualifiedRevenueShare,
      );
      totalPotentialAwardsAmount += potentialAward.amount;
    }
  }

  const scalingFactor =
    totalPotentialAwardsAmount > 0n
      ? Math.min(1, Number(rules.totalAwardPoolValue.amount) / Number(totalPotentialAwardsAmount))
      : 1;

  const cappedTotalPotentialAwards =
    totalPotentialAwardsAmount < rules.totalAwardPoolValue.amount
      ? totalPotentialAwardsAmount
      : rules.totalAwardPoolValue.amount;

  const awardPoolRemainingAmount = rules.totalAwardPoolValue.amount - cappedTotalPotentialAwards;

  const aggregatedMetrics = {
    grandTotalReferrals,
    grandTotalIncrementalDuration,
    grandTotalRevenueContribution: priceEth(grandTotalRevenueContributionAmount),
    awardPoolRemaining: priceUsdc(awardPoolRemainingAmount),
  } satisfies AggregatedReferrerMetricsRevShareLimit;

  validateAggregatedReferrerMetricsRevShareLimit(aggregatedMetrics);

  return { aggregatedMetrics, scalingFactor };
};
