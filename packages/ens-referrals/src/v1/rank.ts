import type { Address } from "viem";

import type { Duration } from "@ensnode/ensnode-sdk";

import { isPositiveInteger } from "./number";
import type { ReferralProgramRules } from "./rules";
import { calcReferrerScore, type ReferrerScore } from "./score";

/**
 * The rank of a referrer relative to all other referrers, where 1 is the
 * top-ranked referrer.
 *
 * @invariant Guaranteed to be a positive integer (> 0)
 */
export type ReferrerRank = number;

export const validateReferrerRank = (rank: ReferrerRank): void => {
  if (!isPositiveInteger(rank)) {
    throw new Error(`Invalid ReferrerRank: ${rank}. ReferrerRank must be a positive integer.`);
  }
};

/**
 * Determine if a referrer with the given `rank` is qualified to receive a non-zero `awardPoolShare` according to the given `rules`.
 *
 * @param rank - The rank of the referrer relative to all other referrers on a {@link ReferrerLeaderboard}.
 * @param rules - The rules of the referral program that generated the `rank`.
 */
export function isReferrerQualified(rank: ReferrerRank, rules: ReferralProgramRules): boolean {
  return rank <= rules.maxQualifiedReferrers;
}

/**
 * Calculate the final score boost of a referrer based on their rank.
 *
 * @param rank - The rank of the referrer relative to all other referrers, where 1 is the
 * top-ranked referrer.
 * @returns The final score boost of the referrer as a number between 0 and 1 (inclusive).
 */
export function calcReferrerFinalScoreBoost(
  rank: ReferrerRank,
  rules: ReferralProgramRules,
): number {
  if (!isReferrerQualified(rank, rules)) return 0;

  // Avoid division by zero when only a single referrer is qualified.
  // In this case, that single referrer (rank 1) should receive the maximum boost.
  if (rules.maxQualifiedReferrers === 1) return 1;

  return 1 - (rank - 1) / (rules.maxQualifiedReferrers - 1);
}

/**
 * Calculate the final score multiplier of a referrer based on their rank.
 *
 * @param rank - The rank of the referrer relative to all other referrers, where 1 is the
 * top-ranked referrer.
 * @returns The final score multiplier of the referrer as a number between 1 and 2 (inclusive).
 */
export function calcReferrerFinalScoreMultiplier(
  rank: ReferrerRank,
  rules: ReferralProgramRules,
): number {
  return 1 + calcReferrerFinalScoreBoost(rank, rules);
}

/**
 * Calculate the final score of a referrer based on their score and final score boost.
 *
 * @param rank - The rank of the referrer relative to all other referrers.
 * @param totalIncrementalDuration - The total incremental duration (in seconds)
 * of referrals made by the referrer within the `rules`.
 * @param rules - The rules of the referral program that generated the `rank`.
 * @returns The final score of the referrer.
 */
export function calcReferrerFinalScore(
  rank: ReferrerRank,
  totalIncrementalDuration: Duration,
  rules: ReferralProgramRules,
): ReferrerScore {
  return (
    calcReferrerScore(totalIncrementalDuration) * calcReferrerFinalScoreMultiplier(rank, rules)
  );
}

export interface ReferrerMetricsForComparison {
  /**
   * The total incremental duration (in seconds) of all referrals made by the referrer within
   * the {@link ReferralProgramRules}.
   */
  totalIncrementalDuration: Duration;

  /**
   * The fully lowercase Ethereum address of the referrer.
   *
   * @invariant Guaranteed to be a valid EVM address in lowercase format.
   */
  referrer: Address;
}

export const compareReferrerMetrics = (
  a: ReferrerMetricsForComparison,
  b: ReferrerMetricsForComparison,
): number => {
  // Primary sort: totalIncrementalDuration (descending)
  if (a.totalIncrementalDuration !== b.totalIncrementalDuration) {
    return b.totalIncrementalDuration - a.totalIncrementalDuration;
  }

  // Secondary sort: referrer address using lexicographic comparison of ASCII hex strings (descending)
  if (b.referrer > a.referrer) return 1;
  if (b.referrer < a.referrer) return -1;
  return 0;
};
