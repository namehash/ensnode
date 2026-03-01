import type { Address } from "viem";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { assertLeaderboardInputs } from "../shared/leaderboard-guards";
import { sortReferrerMetrics } from "../shared/rank";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { AggregatedReferrerMetricsPieSplit } from "./aggregations";
import { buildAggregatedReferrerMetricsPieSplit } from "./aggregations";
import type { AwardedReferrerMetricsPieSplit } from "./metrics";
import {
  buildAwardedReferrerMetricsPieSplit,
  buildRankedReferrerMetricsPieSplit,
  buildScoredReferrerMetricsPieSplit,
} from "./metrics";
import type { ReferralProgramRulesPieSplit } from "./rules";

/**
 * Represents a leaderboard with the pie-split award model for any number of referrers.
 */
export interface ReferrerLeaderboardPieSplit {
  /**
   * Discriminant identifying this as a pie-split leaderboard.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.PieSplit}).
   */
  awardModel: typeof ReferralProgramAwardModels.PieSplit;

  /**
   * The rules of the referral program that generated the {@link ReferrerLeaderboardPieSplit}.
   */
  rules: ReferralProgramRulesPieSplit;

  /**
   * The {@link AggregatedReferrerMetricsPieSplit} for all {@link RankedReferrerMetricsPieSplit} values in `referrers`.
   */
  aggregatedMetrics: AggregatedReferrerMetricsPieSplit;

  /**
   * Ordered map containing `AwardedReferrerMetricsPieSplit` for all referrers with 1 or more
   * `totalReferrals` within the `rules` as of `accurateAsOf`.
   *
   * @invariant Map entries are ordered by `rank` (ascending).
   * @invariant Map is empty if there are no referrers with 1 or more `totalReferrals`
   *            within the `rules` as of `accurateAsOf`.
   * @invariant If a fully-lowercase `Address` is not a key in this map then that `Address` had
   *            0 `totalReferrals`, `totalIncrementalDuration`, and `score` within the
   *            `rules` as of `accurateAsOf`.
   * @invariant Each value in this map is guaranteed to have a non-zero
   *            `totalReferrals`, `totalIncrementalDuration`, and `score`.
   */
  referrers: Map<Address, AwardedReferrerMetricsPieSplit>;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboardPieSplit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

export const buildReferrerLeaderboardPieSplit = (
  allReferrers: ReferrerMetrics[],
  rules: ReferralProgramRulesPieSplit,
  accurateAsOf: UnixTimestamp,
): ReferrerLeaderboardPieSplit => {
  assertLeaderboardInputs(allReferrers, rules, accurateAsOf);

  const sortedReferrers = sortReferrerMetrics(allReferrers);

  const scoredReferrers = sortedReferrers.map((r) => buildScoredReferrerMetricsPieSplit(r));

  const rankedReferrers = scoredReferrers.map((r, index) =>
    buildRankedReferrerMetricsPieSplit(r, index + 1, rules),
  );

  const aggregatedMetrics = buildAggregatedReferrerMetricsPieSplit(rankedReferrers, rules);

  const awardedReferrers = rankedReferrers.map((r) =>
    buildAwardedReferrerMetricsPieSplit(r, aggregatedMetrics, rules),
  );

  const referrers = new Map(awardedReferrers.map((r) => [r.referrer, r]));

  return { awardModel: rules.awardModel, rules, aggregatedMetrics, referrers, accurateAsOf };
};
