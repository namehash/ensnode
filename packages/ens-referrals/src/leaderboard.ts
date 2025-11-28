import type { Address } from "viem";

import { type AggregatedReferrerMetrics, buildAggregatedReferrerMetrics } from "./aggregations";
import {
  type AwardedReferrerMetrics,
  buildAwardedReferrerMetrics,
  buildRankedReferrerMetrics,
  buildScoredReferrerMetrics,
  type ReferrerMetrics,
  sortReferrerMetrics,
} from "./referrer-metrics";
import type { ReferralProgramRules } from "./rules";
import type { UnixTimestamp } from "./time";

/**
 * Represents a leaderboard for any number of referrers.
 */
export interface ReferrerLeaderboard {
  /**
   * The rules of the referral program that generated the {@link ReferrerLeaderboard}.
   */
  rules: ReferralProgramRules;

  /**
   * The {@link AggregatedReferrerMetrics} for all `RankedReferrerMetrics` values in `leaderboard`.
   */
  aggregatedMetrics: AggregatedReferrerMetrics;

  /**
   * Ordered map containing `AwardedReferrerMetrics` for all referrers with 1 or more
   * `totalReferrals` within the `rules` as of `updatedAt`.
   *
   * @invariant Map entries are ordered by `rank` (ascending).
   * @invariant Map is empty if there are no referrers with 1 or more `totalReferrals`
   *            within the `rules` as of `updatedAt`.
   * @invariant If a fully-lowercase `Address` is not a key in this map then that `Address` had
   *            0 `totalReferrals`, `totalIncrementalDuration`, and `score` within the
   *            `rules` as of `updatedAt`.
   * @invariant Each value in this map is guaranteed to have a non-zero
   *            `totalReferrals`, `totalIncrementalDuration`, and `score`.
   */
  referrers: Map<Address, AwardedReferrerMetrics>;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboard} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

export const buildReferrerLeaderboard = (
  allReferrers: ReferrerMetrics[],
  rules: ReferralProgramRules,
  accurateAsOf: UnixTimestamp,
): ReferrerLeaderboard => {
  const uniqueReferrers = allReferrers.map((referrer) => referrer.referrer);
  if (uniqueReferrers.length !== allReferrers.length) {
    throw new Error(
      "ReferrerLeaderboard: Cannot buildReferrerLeaderboard containing duplicate referrers",
    );
  }

  if (accurateAsOf < rules.startTime && allReferrers.length > 0) {
    throw new Error(
      `ReferrerLeaderboard: accurateAsOf (${accurateAsOf}) is before startTime (${rules.startTime}) which indicates allReferrers should be empty, but allReferrers is not empty.`,
    );
  }

  const sortedReferrers = sortReferrerMetrics(allReferrers);

  const scoredReferrers = sortedReferrers.map((referrer) => buildScoredReferrerMetrics(referrer));

  const rankedReferrers = scoredReferrers.map((referrer, index) => {
    return buildRankedReferrerMetrics(referrer, index + 1, rules);
  });

  const aggregatedMetrics = buildAggregatedReferrerMetrics(rankedReferrers, rules);

  const awardedReferrers = rankedReferrers.map((referrer) => {
    return buildAwardedReferrerMetrics(referrer, aggregatedMetrics, rules);
  });

  // Transform ordered list into an ordered map (preserves sort order)
  const referrers = new Map(
    awardedReferrers.map((referrer) => {
      return [referrer.referrer, referrer];
    }),
  );

  return {
    rules,
    aggregatedMetrics,
    referrers,
    accurateAsOf: accurateAsOf,
  };
};
