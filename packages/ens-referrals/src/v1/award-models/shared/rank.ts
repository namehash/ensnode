import type { Address } from "viem";

import type { Duration } from "@ensnode/ensnode-sdk";

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

/**
 * Sorts a list of referrers for leaderboard ranking.
 * Returns a new array — does not mutate the input.
 */
export const sortReferrerMetrics = (referrers: ReferrerMetrics[]): ReferrerMetrics[] => {
  return [...referrers].sort(compareReferrerMetrics);
};
