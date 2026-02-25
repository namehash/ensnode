import { type Duration, type PriceEth, priceEth } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNonNegativeInteger } from "../../number";
import { validateDuration } from "../../time";
import { type ReferrerScore, validateReferrerScore } from "../shared/score";
import type { RankedReferrerMetricsPieSplit } from "./metrics";
import type { ReferralProgramRulesPieSplit } from "./rules";

/**
 * Represents aggregated metrics for a list of {@link RankedReferrerMetricsPieSplit}.
 */
export interface AggregatedReferrerMetricsPieSplit {
  /**
   * @invariant The sum of `totalReferrals` across all {@link RankedReferrerMetricsPieSplit} in the list.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  grandTotalReferrals: number;

  /**
   * @invariant The sum of `totalIncrementalDuration` across all {@link RankedReferrerMetricsPieSplit} in the list.
   */
  grandTotalIncrementalDuration: Duration;

  /**
   * The total revenue contribution in ETH to the ENS DAO from all referrals
   * across all referrers on the leaderboard.
   *
   * This is the sum of `totalRevenueContribution` across all {@link RankedReferrerMetricsPieSplit} in the list.
   *
   * @invariant Guaranteed to be a valid PriceEth with non-negative amount (>= 0n)
   */
  grandTotalRevenueContribution: PriceEth;

  /**
   * @invariant The sum of `finalScore` across all {@link RankedReferrerMetricsPieSplit} where `isQualified` is `true`.
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

export const validateAggregatedReferrerMetricsPieSplit = (
  metrics: AggregatedReferrerMetricsPieSplit,
): void => {
  validateNonNegativeInteger(metrics.grandTotalReferrals);
  validateDuration(metrics.grandTotalIncrementalDuration);

  makePriceEthSchema(
    "AggregatedReferrerMetricsPieSplit.grandTotalRevenueContribution",
  ).parse(metrics.grandTotalRevenueContribution);

  validateReferrerScore(metrics.grandTotalQualifiedReferrersFinalScore);
  validateReferrerScore(metrics.minFinalScoreToQualify);
};

/**
 * Builds aggregated pie-split metrics from a complete, globally ranked list of referrers.
 *
 * **IMPORTANT: This function expects a complete ranking of all referrers.**
 *
 * @param referrers - Must be a complete, globally ranked list of {@link RankedReferrerMetricsPieSplit}
 *                    where ranks start at 1 and are consecutive.
 *                    **This must NOT be a paginated or partial slice of the rankings.**
 *
 * @param rules - The {@link ReferralProgramRulesPieSplit} object that define qualification criteria,
 *                including `maxQualifiedReferrers` (the maximum number of referrers
 *                that can qualify for rewards).
 *
 * @returns Aggregated metrics including totals across all referrers and the minimum
 *          score required to qualify.
 *
 * @remarks
 * - If you need to work with paginated data, aggregate the full ranking first before
 *   calling this function, or call this function on the complete dataset and then paginate
 *   the results.
 * - If `rules.maxQualifiedReferrers === 0`, no referrers can qualify and
 *   `minFinalScoreToQualify` will be set to `Number.MAX_SAFE_INTEGER`.
 * - If `referrers` is empty and `rules.maxQualifiedReferrers > 0`,
 *   `minFinalScoreToQualify` will be set to `0` (anyone can qualify).
 */
export const buildAggregatedReferrerMetricsPieSplit = (
  referrers: RankedReferrerMetricsPieSplit[],
  rules: ReferralProgramRulesPieSplit,
): AggregatedReferrerMetricsPieSplit => {
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
          "AggregatedReferrerMetricsPieSplit: There are referrers on the leaderboard, and the rules allow for qualified referrers, but no qualified referrers.",
        );
      }

      minFinalScoreToQualify = 0;
    }
  }

  const result = {
    grandTotalReferrals,
    grandTotalIncrementalDuration,
    grandTotalRevenueContribution: priceEth(grandTotalRevenueContributionAmount),
    grandTotalQualifiedReferrersFinalScore,
    minFinalScoreToQualify,
  } satisfies AggregatedReferrerMetricsPieSplit;

  validateAggregatedReferrerMetricsPieSplit(result);

  return result;
};
