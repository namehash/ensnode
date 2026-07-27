import { type AccountId, type Duration, stringifyAccountId } from "enssdk";

import { isPositiveInteger } from "../../number";
import type { ReferrerMetrics } from "../../referrer-metrics";

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

export interface ReferrerMetricsForComparison {
  /**
   * The total incremental duration (in seconds) of all referrals made by the referrer within
   * the {@link ReferralProgramRules}.
   */
  totalIncrementalDuration: Duration;

  /**
   * The {@link AccountId} of the referrer.
   */
  referrer: AccountId;
}

export const compareReferrerMetrics = (
  a: ReferrerMetricsForComparison,
  b: ReferrerMetricsForComparison,
): number => {
  // Primary sort: totalIncrementalDuration (descending)
  if (a.totalIncrementalDuration !== b.totalIncrementalDuration) {
    return b.totalIncrementalDuration - a.totalIncrementalDuration;
  }

  // Secondary sort: referrer CAIP-10 string lexicographic (descending) — deterministic tie-break
  // across both chainId and address.
  const aKey = stringifyAccountId(a.referrer);
  const bKey = stringifyAccountId(b.referrer);
  if (bKey > aKey) return 1;
  if (bKey < aKey) return -1;
  return 0;
};

/**
 * Sorts a list of referrers for leaderboard ranking.
 * Returns a new array — does not mutate the input.
 */
export const sortReferrerMetrics = (referrers: ReferrerMetrics[]): ReferrerMetrics[] => {
  return [...referrers].sort(compareReferrerMetrics);
};
