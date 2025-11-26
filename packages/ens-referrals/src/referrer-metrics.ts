import type { Address } from "viem";

import { normalizeAddress, validateLowercaseAddress } from "./address";
import type { AggregatedReferrerMetrics } from "./aggregations";
import type { USDQuantity } from "./currency";
import { validateNonNegativeInteger } from "./number";
import {
  calcReferrerFinalScore,
  calcReferrerFinalScoreBoost,
  compareReferrerMetrics,
  isReferrerQualified,
  type ReferrerRank,
  validateReferrerRank,
} from "./rank";
import type { ReferralProgramRules } from "./rules";
import { calcReferrerScore, type ReferrerScore, validateReferrerScore } from "./score";
import type { Duration } from "./time";
import { validateDuration } from "./time";

/**
 * Represents metrics for a single referrer independent of other referrers.
 */
export interface ReferrerMetrics {
  /**
   * The fully lowercase Ethereum address of the referrer.
   *
   * @invariant Guaranteed to be a valid EVM address in lowercase format
   */
  referrer: Address;

  /**
   * The total number of referrals made by the referrer within the {@link ReferralProgramRules}.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  totalReferrals: number;

  /**
   * The total incremental duration (in seconds) of all referrals made by the referrer within
   * the {@link ReferralProgramRules}.
   */
  totalIncrementalDuration: Duration;

  /**
   * The referrer's score.
   *
   * @invariant Guaranteed to be `calcReferrerScore(totalIncrementalDuration)`
   */
  score: ReferrerScore;
}

export const validateReferrerMetrics = (metrics: ReferrerMetrics): void => {
  validateLowercaseAddress(metrics.referrer);
  validateNonNegativeInteger(metrics.totalReferrals);
  validateDuration(metrics.totalIncrementalDuration);
  validateReferrerScore(metrics.score);

  const expectedScore = calcReferrerScore(metrics.totalIncrementalDuration);
  if (metrics.score !== expectedScore) {
    throw new Error(`Referrer: Invalid score: ${metrics.score}, expected: ${expectedScore}.`);
  }
};

export const buildReferrerMetrics = (
  referrer: Address,
  totalReferrals: number,
  totalIncrementalDuration: Duration,
): ReferrerMetrics => {
  const result = {
    referrer: normalizeAddress(referrer),
    totalReferrals,
    totalIncrementalDuration,
    score: calcReferrerScore(totalIncrementalDuration),
  } satisfies ReferrerMetrics;

  validateReferrerMetrics(result);
  return result;
};

export const sortReferrerMetrics = (referrers: ReferrerMetrics[]): ReferrerMetrics[] => {
  return [...referrers].sort(compareReferrerMetrics);
};

/**
 * Extends {@link ReferrerMetrics} to include additional metrics
 * relative to all other referrers on a {@link ReferrerLeaderboard} and {@link ReferralProgramRules}.
 */
export interface RankedReferrerMetrics extends ReferrerMetrics {
  /**
   * The referrer's rank on the {@link ReferrerLeaderboard} relative to all other referrers.
   */
  rank: ReferrerRank;

  /**
   * Identifies if the referrer meets the qualifications of the {@link ReferralProgramRules} to receive a non-zero `awardPoolShare`.
   *
   * @invariant true if and only if `rank` is less than or equal to {@link ReferralProgramRules.maxQualifiedReferrers}
   */
  isQualified: boolean;

  /**
   * The referrer's final score boost.
   *
   * @invariant Guaranteed to be a number between 0 and 1 (inclusive)
   * @invariant Calculated as: `1-((rank-1)/({@link ReferralProgramRules.maxQualifiedReferrers}-1))` if `isQualified` is `true`, else `0`
   */
  finalScoreBoost: number;

  /**
   * The referrer's final score.
   *
   * @invariant Calculated as: `score * (1 + finalScoreBoost)`
   */
  finalScore: ReferrerScore;
}

export const validateRankedReferrerMetrics = (
  metrics: RankedReferrerMetrics,
  rules: ReferralProgramRules,
): void => {
  validateReferrerMetrics(metrics);
  validateReferrerRank(metrics.rank);

  if (metrics.finalScoreBoost < 0 || metrics.finalScoreBoost > 1) {
    throw new Error(
      `Invalid RankedReferrerMetrics: Invalid finalScoreBoost: ${metrics.finalScoreBoost}. finalScoreBoost must be between 0 and 1 (inclusive).`,
    );
  }

  validateReferrerScore(metrics.finalScore);

  const expectedIsQualified = isReferrerQualified(metrics.rank, rules);
  if (metrics.isQualified !== expectedIsQualified) {
    throw new Error(
      `RankedReferrerMetrics: Invalid isQualified: ${metrics.isQualified}, expected: ${expectedIsQualified}.`,
    );
  }

  const expectedFinalScoreBoost = calcReferrerFinalScoreBoost(metrics.rank, rules);
  if (metrics.finalScoreBoost !== expectedFinalScoreBoost) {
    throw new Error(
      `RankedReferrerMetrics: Invalid finalScoreBoost: ${metrics.finalScoreBoost}, expected: ${expectedFinalScoreBoost}.`,
    );
  }

  const expectedFinalScore = calcReferrerFinalScore(
    metrics.rank,
    metrics.totalIncrementalDuration,
    rules,
  );
  if (metrics.finalScore !== expectedFinalScore) {
    throw new Error(
      `RankedReferrerMetrics: Invalid finalScore: ${metrics.finalScore}, expected: ${expectedFinalScore}.`,
    );
  }
};

export const buildRankedReferrerMetrics = (
  referrer: ReferrerMetrics,
  rank: ReferrerRank,
  rules: ReferralProgramRules,
): RankedReferrerMetrics => {
  const result = {
    ...referrer,
    rank,
    isQualified: isReferrerQualified(rank, rules),
    finalScoreBoost: calcReferrerFinalScoreBoost(rank, rules),
    finalScore: calcReferrerFinalScore(rank, referrer.totalIncrementalDuration, rules),
  } satisfies RankedReferrerMetrics;
  validateRankedReferrerMetrics(result, rules);
  return result;
};

/**
 * Calculate the share of the award pool for a referrer.
 * @param referrer - The referrer to calculate the award pool share for.
 * @param aggregatedMetrics - Aggregated metrics for all referrers.
 * @param rules - The rules of the referral program.
 * @returns The referrer's share of the award pool as a number between 0 and 1 (inclusive).
 */
export const calcReferrerAwardPoolShare = (
  referrer: RankedReferrerMetrics,
  aggregatedMetrics: AggregatedReferrerMetrics,
  rules: ReferralProgramRules,
): number => {
  if (!isReferrerQualified(referrer.rank, rules)) return 0;
  if (aggregatedMetrics.grandTotalQualifiedReferrersFinalScore === 0) return 0;

  return (
    calcReferrerFinalScore(referrer.rank, referrer.totalIncrementalDuration, rules) /
    aggregatedMetrics.grandTotalQualifiedReferrersFinalScore
  );
};

/**
 * Extends {@link RankedReferrerMetrics} to include additional metrics
 * relative to {@link AggregatedRankedReferrerMetrics}.
 */
export interface AwardedReferrerMetrics extends RankedReferrerMetrics {
  /**
   * The referrer's share of the award pool.
   *
   * @invariant Guaranteed to be a number between 0 and 1 (inclusive)
   * @invariant Calculated as: `finalScore / {@link AggregatedRankedReferrerMetrics.grandTotalQualifiedReferrersFinalScore}` if `isQualified` is `true`, else `0`
   */
  awardPoolShare: number;

  /**
   * The approximate {@link USDQuantity} of the referrer's share of the {@link ReferralProgramRules.totalAwardPoolValue}.
   *
   * @invariant Guaranteed to be a number between 0 and {@link ReferralProgramRules.totalAwardPoolValue} (inclusive)
   * @invariant Calculated as: `awardPoolShare` * {@link ReferralProgramRules.totalAwardPoolValue}
   */
  awardPoolApproxValue: USDQuantity;
}

export const validateAwardedReferrerMetrics = (
  referrer: AwardedReferrerMetrics,
  rules: ReferralProgramRules,
): void => {
  validateRankedReferrerMetrics(referrer, rules);
  if (referrer.awardPoolShare < 0 || referrer.awardPoolShare > 1) {
    throw new Error(
      `Invalid AwardedReferrerMetrics: ${referrer.awardPoolShare}. awardPoolShare must be between 0 and 1 (inclusive).`,
    );
  }

  if (
    referrer.awardPoolApproxValue < 0 ||
    referrer.awardPoolApproxValue > rules.totalAwardPoolValue
  ) {
    throw new Error(
      `Invalid AwardedReferrerMetrics: ${referrer.awardPoolApproxValue}. awardPoolApproxValue must be between 0 and ${rules.totalAwardPoolValue} (inclusive).`,
    );
  }
};

export const buildAwardedReferrerMetrics = (
  referrer: RankedReferrerMetrics,
  aggregatedMetrics: AggregatedReferrerMetrics,
  rules: ReferralProgramRules,
): AwardedReferrerMetrics => {
  const awardPoolShare = calcReferrerAwardPoolShare(referrer, aggregatedMetrics, rules);

  const result = {
    ...referrer,
    awardPoolShare,
    awardPoolApproxValue: awardPoolShare * rules.totalAwardPoolValue,
  };
  validateAwardedReferrerMetrics(result, rules);
  return result;
};
