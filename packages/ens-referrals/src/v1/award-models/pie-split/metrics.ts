import type { Address } from "viem";

import { type PriceUsdc, priceEth, priceUsdc, scalePrice } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { buildReferrerMetrics, validateReferrerMetrics } from "../../referrer-metrics";
import type { ReferrerRank } from "../shared/rank";
import { validateReferrerRank } from "../shared/rank";
import { type ReferrerScore, validateReferrerScore } from "../shared/score";
import type { AggregatedReferrerMetricsPieSplit } from "./aggregations";
import {
  calcReferrerFinalScoreBoostPieSplit,
  calcReferrerFinalScorePieSplit,
  isReferrerQualifiedPieSplit,
} from "./rank";
import type { ReferralProgramRulesPieSplit } from "./rules";
import { calcReferrerScorePieSplit } from "./score";

/**
 * Represents metrics for a single referrer independent of other referrers,
 * including a calculation of the referrer's score.
 */
export interface ScoredReferrerMetricsPieSplit extends ReferrerMetrics {
  /**
   * The referrer's score.
   *
   * @invariant Guaranteed to be `calcReferrerScorePieSplit(totalIncrementalDuration)`
   */
  score: ReferrerScore;
}

export const buildScoredReferrerMetricsPieSplit = (
  referrer: ReferrerMetrics,
): ScoredReferrerMetricsPieSplit => {
  const result = {
    ...referrer,
    score: calcReferrerScorePieSplit(referrer.totalIncrementalDuration),
  } satisfies ScoredReferrerMetricsPieSplit;

  validateScoredReferrerMetricsPieSplit(result);
  return result;
};

export const validateScoredReferrerMetricsPieSplit = (
  metrics: ScoredReferrerMetricsPieSplit,
): void => {
  validateReferrerMetrics(metrics);
  validateReferrerScore(metrics.score);

  const expectedScore = calcReferrerScorePieSplit(metrics.totalIncrementalDuration);
  if (metrics.score !== expectedScore) {
    throw new Error(`Referrer: Invalid score: ${metrics.score}, expected: ${expectedScore}.`);
  }
};

/**
 * Extends {@link ScoredReferrerMetricsPieSplit} to include additional metrics relative to all
 * other referrers on a {@link ReferrerLeaderboardPieSplit} and {@link ReferralProgramRulesPieSplit}.
 */
export interface RankedReferrerMetricsPieSplit extends ScoredReferrerMetricsPieSplit {
  /**
   * The referrer's rank on the {@link ReferrerLeaderboardPieSplit} relative to all other referrers.
   */
  rank: ReferrerRank;

  /**
   * Identifies if the referrer meets the qualifications of the {@link ReferralProgramRulesPieSplit} to receive a non-zero `awardPoolShare`.
   *
   * @invariant true if and only if `rank` is less than or equal to {@link ReferralProgramRulesPieSplit.maxQualifiedReferrers}
   */
  isQualified: boolean;

  /**
   * The referrer's final score boost.
   *
   * @invariant Guaranteed to be a number between 0 and 1 (inclusive)
   * @invariant Calculated as: `1-((rank-1)/({@link ReferralProgramRulesPieSplit.maxQualifiedReferrers}-1))` if `isQualified` is `true`, else `0`
   */
  finalScoreBoost: number;

  /**
   * The referrer's final score.
   *
   * @invariant Calculated as: `score * (1 + finalScoreBoost)`
   */
  finalScore: ReferrerScore;
}

export const validateRankedReferrerMetricsPieSplit = (
  metrics: RankedReferrerMetricsPieSplit,
  rules: ReferralProgramRulesPieSplit,
): void => {
  validateScoredReferrerMetricsPieSplit(metrics);
  validateReferrerRank(metrics.rank);

  if (metrics.finalScoreBoost < 0 || metrics.finalScoreBoost > 1) {
    throw new Error(
      `Invalid RankedReferrerMetricsPieSplit: Invalid finalScoreBoost: ${metrics.finalScoreBoost}. finalScoreBoost must be between 0 and 1 (inclusive).`,
    );
  }

  validateReferrerScore(metrics.finalScore);

  const expectedIsQualified = isReferrerQualifiedPieSplit(metrics.rank, rules);
  if (metrics.isQualified !== expectedIsQualified) {
    throw new Error(
      `RankedReferrerMetricsPieSplit: Invalid isQualified: ${metrics.isQualified}, expected: ${expectedIsQualified}.`,
    );
  }

  const expectedFinalScoreBoost = calcReferrerFinalScoreBoostPieSplit(metrics.rank, rules);
  if (metrics.finalScoreBoost !== expectedFinalScoreBoost) {
    throw new Error(
      `RankedReferrerMetricsPieSplit: Invalid finalScoreBoost: ${metrics.finalScoreBoost}, expected: ${expectedFinalScoreBoost}.`,
    );
  }

  const expectedFinalScore = calcReferrerFinalScorePieSplit(
    metrics.rank,
    metrics.totalIncrementalDuration,
    rules,
  );
  if (metrics.finalScore !== expectedFinalScore) {
    throw new Error(
      `RankedReferrerMetricsPieSplit: Invalid finalScore: ${metrics.finalScore}, expected: ${expectedFinalScore}.`,
    );
  }
};

export const buildRankedReferrerMetricsPieSplit = (
  referrer: ScoredReferrerMetricsPieSplit,
  rank: ReferrerRank,
  rules: ReferralProgramRulesPieSplit,
): RankedReferrerMetricsPieSplit => {
  const result = {
    ...referrer,
    rank,
    isQualified: isReferrerQualifiedPieSplit(rank, rules),
    finalScoreBoost: calcReferrerFinalScoreBoostPieSplit(rank, rules),
    finalScore: calcReferrerFinalScorePieSplit(rank, referrer.totalIncrementalDuration, rules),
  } satisfies RankedReferrerMetricsPieSplit;
  validateRankedReferrerMetricsPieSplit(result, rules);
  return result;
};

/**
 * Calculate the share of the award pool for a referrer.
 * @param referrer - The referrer to calculate the award pool share for.
 * @param aggregatedMetrics - Aggregated metrics for all referrers.
 * @param rules - The rules of the referral program.
 * @returns The referrer's share of the award pool as a number between 0 and 1 (inclusive).
 */
export const calcReferrerAwardPoolSharePieSplit = (
  referrer: RankedReferrerMetricsPieSplit,
  aggregatedMetrics: AggregatedReferrerMetricsPieSplit,
): number => {
  if (!referrer.isQualified) return 0;
  if (aggregatedMetrics.grandTotalQualifiedReferrersFinalScore === 0) return 0;

  return referrer.finalScore / aggregatedMetrics.grandTotalQualifiedReferrersFinalScore;
};

/**
 * Extends {@link RankedReferrerMetricsPieSplit} to include additional metrics
 * relative to {@link AggregatedReferrerMetricsPieSplit}.
 */
export interface AwardedReferrerMetricsPieSplit extends RankedReferrerMetricsPieSplit {
  /**
   * The referrer's share of the award pool.
   *
   * @invariant Guaranteed to be a number between 0 and 1 (inclusive)
   * @invariant Calculated as: `finalScore / {@link AggregatedReferrerMetricsPieSplit.grandTotalQualifiedReferrersFinalScore}` if `isQualified` is `true`, else `0`
   */
  awardPoolShare: number;

  /**
   * The approximate USDC value of the referrer's share of the {@link ReferralProgramRulesPieSplit.totalAwardPoolValue}.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with amount between 0 and {@link ReferralProgramRulesPieSplit.totalAwardPoolValue.amount} (inclusive)
   * @invariant Calculated as: `awardPoolShare` * {@link ReferralProgramRulesPieSplit.totalAwardPoolValue.amount}
   */
  awardPoolApproxValue: PriceUsdc;
}

export const validateAwardedReferrerMetricsPieSplit = (
  referrer: AwardedReferrerMetricsPieSplit,
  rules: ReferralProgramRulesPieSplit,
): void => {
  validateRankedReferrerMetricsPieSplit(referrer, rules);
  if (referrer.awardPoolShare < 0 || referrer.awardPoolShare > 1) {
    throw new Error(
      `Invalid AwardedReferrerMetricsPieSplit: ${referrer.awardPoolShare}. awardPoolShare must be between 0 and 1 (inclusive).`,
    );
  }

  makePriceUsdcSchema("AwardedReferrerMetricsPieSplit.awardPoolApproxValue").parse(
    referrer.awardPoolApproxValue,
  );

  if (referrer.awardPoolApproxValue.amount > rules.totalAwardPoolValue.amount) {
    throw new Error(
      `AwardedReferrerMetricsPieSplit: awardPoolApproxValue.amount ${referrer.awardPoolApproxValue.amount.toString()} exceeds totalAwardPoolValue.amount ${rules.totalAwardPoolValue.amount.toString()}.`,
    );
  }
};

export const buildAwardedReferrerMetricsPieSplit = (
  referrer: RankedReferrerMetricsPieSplit,
  aggregatedMetrics: AggregatedReferrerMetricsPieSplit,
  rules: ReferralProgramRulesPieSplit,
): AwardedReferrerMetricsPieSplit => {
  const awardPoolShare = calcReferrerAwardPoolSharePieSplit(referrer, aggregatedMetrics);

  // Calculate the approximate USDC value by multiplying the share by the total award pool value
  const awardPoolApproxValue = scalePrice(rules.totalAwardPoolValue, awardPoolShare);

  const result = {
    ...referrer,
    awardPoolShare,
    awardPoolApproxValue,
  } satisfies AwardedReferrerMetricsPieSplit;
  validateAwardedReferrerMetricsPieSplit(result, rules);
  return result;
};

/**
 * Extends {@link AwardedReferrerMetricsPieSplit} but with rank set to null to represent
 * a referrer who is not on the leaderboard (has zero referrals within the rules associated with the leaderboard).
 */
export interface UnrankedReferrerMetricsPieSplit
  extends Omit<AwardedReferrerMetricsPieSplit, "rank" | "isQualified"> {
  /**
   * The referrer is not on the leaderboard and therefore has no rank.
   */
  rank: null;

  /**
   * Always false for unranked referrers.
   */
  isQualified: false;
}

export const validateUnrankedReferrerMetricsPieSplit = (
  metrics: UnrankedReferrerMetricsPieSplit,
): void => {
  validateScoredReferrerMetricsPieSplit(metrics);

  if (metrics.rank !== null) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: rank must be null, got: ${metrics.rank}.`,
    );
  }
  if (metrics.isQualified !== false) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: isQualified must be false, got: ${metrics.isQualified}.`,
    );
  }
  if (metrics.totalReferrals !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: totalReferrals must be 0, got: ${metrics.totalReferrals}.`,
    );
  }
  if (metrics.totalIncrementalDuration !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: totalIncrementalDuration must be 0, got: ${metrics.totalIncrementalDuration}.`,
    );
  }

  makePriceEthSchema("UnrankedReferrerMetricsPieSplit.totalRevenueContribution").parse(
    metrics.totalRevenueContribution,
  );
  if (metrics.totalRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: totalRevenueContribution.amount must be 0n, got: ${metrics.totalRevenueContribution.amount.toString()}.`,
    );
  }

  if (metrics.score !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: score must be 0, got: ${metrics.score}.`,
    );
  }
  if (metrics.finalScoreBoost !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: finalScoreBoost must be 0, got: ${metrics.finalScoreBoost}.`,
    );
  }
  if (metrics.finalScore !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: finalScore must be 0, got: ${metrics.finalScore}.`,
    );
  }
  if (metrics.awardPoolShare !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: awardPoolShare must be 0, got: ${metrics.awardPoolShare}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsPieSplit.awardPoolApproxValue").parse(
    metrics.awardPoolApproxValue,
  );
  if (metrics.awardPoolApproxValue.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsPieSplit: awardPoolApproxValue must be 0n, got: ${metrics.awardPoolApproxValue.amount.toString()}.`,
    );
  }
};

/**
 * Build an unranked zero-score referrer record for a referrer address that is not in the leaderboard.
 *
 * This is useful when you want to return a referrer record for an address that has no referrals
 * and is not qualified for the leaderboard.
 *
 * @param referrer - The referrer address
 * @returns An {@link UnrankedReferrerMetricsPieSplit} with zero values for all metrics and null rank
 */
export const buildUnrankedReferrerMetricsPieSplit = (
  referrer: Address,
): UnrankedReferrerMetricsPieSplit => {
  const metrics = buildReferrerMetrics(referrer, 0, 0, priceEth(0n));
  const scoredMetrics = buildScoredReferrerMetricsPieSplit(metrics);

  const result = {
    ...scoredMetrics,
    rank: null,
    isQualified: false,
    finalScoreBoost: 0,
    finalScore: 0,
    awardPoolShare: 0,
    awardPoolApproxValue: priceUsdc(0n),
  } satisfies UnrankedReferrerMetricsPieSplit;

  validateUnrankedReferrerMetricsPieSplit(result);
  return result;
};
