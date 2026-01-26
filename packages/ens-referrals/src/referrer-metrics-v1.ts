import type { Address } from "viem";

import type { Duration, PriceEth, PriceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { normalizeAddress, validateLowercaseAddress } from "./address";
import type { AggregatedReferrerMetrics } from "./aggregations-v1";
import { validateNonNegativeInteger } from "./number";
import {
  calcReferrerFinalScore,
  calcReferrerFinalScoreBoost,
  compareReferrerMetrics,
  isReferrerQualified,
  type ReferrerRank,
  validateReferrerRank,
} from "./rank-v1";
import type { ReferralProgramRules } from "./rules-v1";
import { calcReferrerScore, type ReferrerScore, validateReferrerScore } from "./score";
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
   * The total revenue contribution in ETH made to the ENS DAO by all referrals
   * from this referrer.
   *
   * This is the sum of the total cost paid by registrants for all registrar actions
   * where this address was the referrer.
   *
   * @invariant Guaranteed to be a valid PriceEth with non-negative amount (>= 0n)
   * @invariant Never null (records with null `total` in the database are treated as 0 when summing)
   */
  totalRevenueContribution: PriceEth;
}

export const buildReferrerMetrics = (
  referrer: Address,
  totalReferrals: number,
  totalIncrementalDuration: Duration,
  totalRevenueContribution: PriceEth,
): ReferrerMetrics => {
  const result = {
    referrer: normalizeAddress(referrer),
    totalReferrals,
    totalIncrementalDuration,
    totalRevenueContribution,
  } satisfies ReferrerMetrics;

  validateReferrerMetrics(result);
  return result;
};

export const validateReferrerMetrics = (metrics: ReferrerMetrics): void => {
  validateLowercaseAddress(metrics.referrer);
  validateNonNegativeInteger(metrics.totalReferrals);
  validateDuration(metrics.totalIncrementalDuration);

  // Validate totalRevenueContribution using Zod schema
  const priceEthSchema = makePriceEthSchema("ReferrerMetrics.totalRevenueContribution");
  const parseResult = priceEthSchema.safeParse(metrics.totalRevenueContribution);
  if (!parseResult.success) {
    throw new Error(
      `ReferrerMetrics: totalRevenueContribution validation failed: ${parseResult.error.message}`,
    );
  }
};

export const sortReferrerMetrics = (referrers: ReferrerMetrics[]): ReferrerMetrics[] => {
  return [...referrers].sort(compareReferrerMetrics);
};

/**
 * Represents metrics for a single referrer independent of other referrers,
 * including a calculation of the referrer's score.
 */
export interface ScoredReferrerMetrics extends ReferrerMetrics {
  /**
   * The referrer's score.
   *
   * @invariant Guaranteed to be `calcReferrerScore(totalIncrementalDuration)`
   */
  score: ReferrerScore;
}

export const buildScoredReferrerMetrics = (referrer: ReferrerMetrics): ScoredReferrerMetrics => {
  const result = {
    ...referrer,
    score: calcReferrerScore(referrer.totalIncrementalDuration),
  } satisfies ScoredReferrerMetrics;

  validateScoredReferrerMetrics(result);
  return result;
};

export const validateScoredReferrerMetrics = (metrics: ScoredReferrerMetrics): void => {
  validateReferrerMetrics(metrics);
  validateReferrerScore(metrics.score);

  const expectedScore = calcReferrerScore(metrics.totalIncrementalDuration);
  if (metrics.score !== expectedScore) {
    throw new Error(`Referrer: Invalid score: ${metrics.score}, expected: ${expectedScore}.`);
  }
};

/**
 * Extends {@link ScoredReferrerMetrics} to include additional metrics
 * relative to all other referrers on a {@link ReferrerLeaderboard} and {@link ReferralProgramRules}.
 */
export interface RankedReferrerMetrics extends ScoredReferrerMetrics {
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
  validateScoredReferrerMetrics(metrics);
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
  referrer: ScoredReferrerMetrics,
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
   * The approximate USDC value of the referrer's share of the {@link ReferralProgramRules.totalAwardPoolValue}.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with amount between 0 and {@link ReferralProgramRules.totalAwardPoolValue.amount} (inclusive)
   * @invariant Calculated as: `awardPoolShare` * {@link ReferralProgramRules.totalAwardPoolValue.amount}
   */
  awardPoolApproxValue: PriceUsdc;
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
    referrer.awardPoolApproxValue.amount < 0n ||
    referrer.awardPoolApproxValue.amount > rules.totalAwardPoolValue.amount
  ) {
    throw new Error(
      `Invalid AwardedReferrerMetrics: ${referrer.awardPoolApproxValue.amount.toString()}. awardPoolApproxValue must be between 0 and ${rules.totalAwardPoolValue.amount.toString()} (inclusive).`,
    );
  }
};

export const buildAwardedReferrerMetrics = (
  referrer: RankedReferrerMetrics,
  aggregatedMetrics: AggregatedReferrerMetrics,
  rules: ReferralProgramRules,
): AwardedReferrerMetrics => {
  const awardPoolShare = calcReferrerAwardPoolShare(referrer, aggregatedMetrics, rules);

  // Calculate the approximate USDC value by multiplying the share by the total award pool value
  // We need to convert the share (a number between 0 and 1) to a bigint amount
  const awardPoolApproxAmount = BigInt(
    Math.floor(awardPoolShare * Number(rules.totalAwardPoolValue.amount)),
  );

  const result = {
    ...referrer,
    awardPoolShare,
    awardPoolApproxValue: {
      currency: "USDC" as const,
      amount: awardPoolApproxAmount,
    },
  };
  validateAwardedReferrerMetrics(result, rules);
  return result;
};

/**
 * Extends {@link AwardedReferrerMetrics} but with rank set to null to represent
 * a referrer who is not on the leaderboard (has zero referrals within the rules associated with the leaderboard).
 */
export interface UnrankedReferrerMetrics
  extends Omit<AwardedReferrerMetrics, "rank" | "isQualified"> {
  /**
   * The referrer is not on the leaderboard and therefore has no rank.
   */
  rank: null;

  /**
   * Always false for unranked referrers.
   */
  isQualified: false;
}

export const validateUnrankedReferrerMetrics = (metrics: UnrankedReferrerMetrics): void => {
  validateScoredReferrerMetrics(metrics);

  if (metrics.rank !== null) {
    throw new Error(`Invalid UnrankedReferrerMetrics: rank must be null, got: ${metrics.rank}.`);
  }

  if (metrics.isQualified !== false) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: isQualified must be false, got: ${metrics.isQualified}.`,
    );
  }

  if (metrics.totalReferrals !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: totalReferrals must be 0, got: ${metrics.totalReferrals}.`,
    );
  }

  if (metrics.totalIncrementalDuration !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: totalIncrementalDuration must be 0, got: ${metrics.totalIncrementalDuration}.`,
    );
  }

  // Validate totalRevenueContribution using Zod schema
  const priceEthSchema = makePriceEthSchema("UnrankedReferrerMetrics.totalRevenueContribution");
  const ethParseResult = priceEthSchema.safeParse(metrics.totalRevenueContribution);
  if (!ethParseResult.success) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: totalRevenueContribution validation failed: ${ethParseResult.error.message}`,
    );
  }
  if (metrics.totalRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: totalRevenueContribution must be 0n, got: ${metrics.totalRevenueContribution.amount.toString()}.`,
    );
  }

  if (metrics.score !== 0) {
    throw new Error(`Invalid UnrankedReferrerMetrics: score must be 0, got: ${metrics.score}.`);
  }

  if (metrics.finalScoreBoost !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: finalScoreBoost must be 0, got: ${metrics.finalScoreBoost}.`,
    );
  }

  if (metrics.finalScore !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: finalScore must be 0, got: ${metrics.finalScore}.`,
    );
  }

  if (metrics.awardPoolShare !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: awardPoolShare must be 0, got: ${metrics.awardPoolShare}.`,
    );
  }

  // Validate awardPoolApproxValue using Zod schema
  const priceUsdcSchema = makePriceUsdcSchema("UnrankedReferrerMetrics.awardPoolApproxValue");
  const usdcParseResult = priceUsdcSchema.safeParse(metrics.awardPoolApproxValue);
  if (!usdcParseResult.success) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: awardPoolApproxValue validation failed: ${usdcParseResult.error.message}`,
    );
  }
  if (metrics.awardPoolApproxValue.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetrics: awardPoolApproxValue must be 0n, got: ${metrics.awardPoolApproxValue.amount.toString()}.`,
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
 * @returns An {@link UnrankedReferrerMetrics} with zero values for all metrics and null rank
 */
export const buildUnrankedReferrerMetrics = (referrer: Address): UnrankedReferrerMetrics => {
  const baseMetrics = buildReferrerMetrics(referrer, 0, 0, {
    currency: "ETH" as const,
    amount: 0n,
  });
  const scoredMetrics = buildScoredReferrerMetrics(baseMetrics);

  const result = {
    ...scoredMetrics,
    rank: null,
    isQualified: false,
    finalScoreBoost: 0,
    finalScore: 0,
    awardPoolShare: 0,
    awardPoolApproxValue: {
      currency: "USDC" as const,
      amount: 0n,
    },
  } satisfies UnrankedReferrerMetrics;

  validateUnrankedReferrerMetrics(result);
  return result;
};
