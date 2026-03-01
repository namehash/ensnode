import type { Duration } from "@ensnode/ensnode-sdk";

import type { ReferrerRank } from "../shared/rank";
import type { ReferrerScore } from "../shared/score";
import type { ReferralProgramRulesPieSplit } from "./rules";
import { calcReferrerScorePieSplit } from "./score";

/**
 * Determine if a referrer with the given `rank` is qualified to receive a non-zero
 * `awardPoolShare` under pie-split rules.
 *
 * @param rank - The rank of the referrer relative to all other referrers on a leaderboard.
 * @param rules - The pie-split rules of the referral program.
 */
export function isReferrerQualifiedPieSplit(
  rank: ReferrerRank,
  rules: ReferralProgramRulesPieSplit,
): boolean {
  return rank <= rules.maxQualifiedReferrers;
}

/**
 * Calculate the final score boost of a referrer based on their rank (pie-split only).
 *
 * @param rank - The rank of the referrer relative to all other referrers, where 1 is the
 * top-ranked referrer.
 * @returns The final score boost of the referrer as a number between 0 and 1 (inclusive).
 */
export function calcReferrerFinalScoreBoostPieSplit(
  rank: ReferrerRank,
  rules: ReferralProgramRulesPieSplit,
): number {
  if (!isReferrerQualifiedPieSplit(rank, rules)) return 0;

  // Avoid division by zero when only a single referrer is qualified.
  // In this case, that single referrer (rank 1) should receive the maximum boost.
  if (rules.maxQualifiedReferrers === 1) return 1;

  return 1 - (rank - 1) / (rules.maxQualifiedReferrers - 1);
}

/**
 * Calculate the final score multiplier of a referrer based on their rank (pie-split only).
 *
 * @param rank - The rank of the referrer relative to all other referrers, where 1 is the
 * top-ranked referrer.
 * @returns The final score multiplier of the referrer as a number between 1 and 2 (inclusive).
 */
export function calcReferrerFinalScoreMultiplierPieSplit(
  rank: ReferrerRank,
  rules: ReferralProgramRulesPieSplit,
): number {
  return 1 + calcReferrerFinalScoreBoostPieSplit(rank, rules);
}

/**
 * Calculate the final score of a referrer based on their score and final score boost (pie-split only).
 *
 * @param rank - The rank of the referrer relative to all other referrers.
 * @param totalIncrementalDuration - The total incremental duration (in seconds)
 * of referrals made by the referrer within the `rules`.
 * @param rules - The pie-split rules of the referral program.
 */
export function calcReferrerFinalScorePieSplit(
  rank: ReferrerRank,
  totalIncrementalDuration: Duration,
  rules: ReferralProgramRulesPieSplit,
): ReferrerScore {
  return (
    calcReferrerScorePieSplit(totalIncrementalDuration) *
    calcReferrerFinalScoreMultiplierPieSplit(rank, rules)
  );
}
