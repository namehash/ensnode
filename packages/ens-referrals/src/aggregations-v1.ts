import type { Duration, PriceEth } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "./number";
import type { RankedReferrerMetrics } from "./referrer-metrics-v1";
import type { ReferralProgramRules } from "./rules-v1";
import { type ReferrerScore, validateReferrerScore } from "./score";
import { validateDuration } from "./time";

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
   * The total revenue contribution in ETH to the ENS DAO from all referrals
   * across all referrers on the leaderboard.
   *
   * This is the sum of `totalRevenueContribution` across all `RankedReferrerMetrics` in the list.
   *
   * @invariant Guaranteed to be a valid PriceEth with non-negative amount (>= 0n)
   */
  grandTotalRevenueContribution: PriceEth;

  /**
   * @invariant The sum of `finalScore` across all `RankedReferrerMetrics` where `isQualified` is `true`.
   */
  grandTotalQualifiedReferrersFinalScore: ReferrerScore;

  /**
   * @invariant Identifies the minimum final score required to become a qualified referrer.
   * @invariant If `rules.maxQualifiedReferrers` is 0, then `minFinalScoreToQualify` is guaranteed to
   *            be `Number.MAX_SAFE_INTEGER`.
   * @invariant If `rules.maxQualifiedReferrers` is greater than 0, and there are no current referrers
   *            matching the `rules`, then `minFinalScoreToQualify` is guaranteed to be `0`.
   */
  minFinalScoreToQualify: ReferrerScore;
}

export const validateAggregatedReferrerMetrics = (metrics: AggregatedReferrerMetrics): void => {
  validateNonNegativeInteger(metrics.grandTotalReferrals);
  validateDuration(metrics.grandTotalIncrementalDuration);

  // Validate grandTotalRevenueContribution using Zod schema
  const priceEthSchema = makePriceEthSchema(
    "AggregatedReferrerMetrics.grandTotalRevenueContribution",
  );
  const parseResult = priceEthSchema.safeParse(metrics.grandTotalRevenueContribution);
  if (!parseResult.success) {
    throw new Error(
      `AggregatedReferrerMetrics: grandTotalRevenueContribution validation failed: ${parseResult.error.message}`,
    );
  }

  validateReferrerScore(metrics.grandTotalQualifiedReferrersFinalScore);
  validateReferrerScore(metrics.minFinalScoreToQualify);
};

export const buildAggregatedReferrerMetrics = (
  referrers: RankedReferrerMetrics[],
  rules: ReferralProgramRules,
): AggregatedReferrerMetrics => {
  let grandTotalReferrals = 0;
  let grandTotalIncrementalDuration = 0;
  let grandTotalRevenueContributionAmount = 0n;
  let grandTotalQualifiedReferrersFinalScore = 0;
  let minFinalScoreToQualify = Number.MAX_SAFE_INTEGER;

  for (const referrer of referrers) {
    grandTotalReferrals += referrer.totalReferrals;
    grandTotalIncrementalDuration += referrer.totalIncrementalDuration;
    grandTotalRevenueContributionAmount += referrer.totalRevenueContribution.amount;
    if (referrer.isQualified) {
      grandTotalQualifiedReferrersFinalScore += referrer.finalScore;
      if (referrer.finalScore < minFinalScoreToQualify) {
        minFinalScoreToQualify = referrer.finalScore;
      }
    }
  }

  if (minFinalScoreToQualify === Number.MAX_SAFE_INTEGER) {
    if (rules.maxQualifiedReferrers === 0) {
      // ... because it's impossible to qualify based on the rules
      // therefore keep minFinalScoreToQualify as Number.MAX_SAFE_INTEGER
    } else {
      // ... because there are no referrers at all on the leaderboard
      if (referrers.length !== 0) {
        // invariant sanity check
        throw new Error(
          "AggregatedReferrerMetrics: There are referrers on the leaderboard, and the rules allow for qualified referrers, but no qualified referrers.",
        );
      }

      minFinalScoreToQualify = 0;
    }
  }

  const result = {
    grandTotalReferrals,
    grandTotalIncrementalDuration,
    grandTotalRevenueContribution: {
      currency: "ETH" as const,
      amount: grandTotalRevenueContributionAmount,
    },
    grandTotalQualifiedReferrersFinalScore,
    minFinalScoreToQualify,
  };

  validateAggregatedReferrerMetrics(result);

  return result;
};
