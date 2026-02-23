import type { Address } from "viem";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { assertLeaderboardInputs } from "../shared/leaderboard-guards";
import { sortReferrerMetrics } from "../shared/rank";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { AggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import { buildAggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import type { AwardedReferrerMetricsRevShareLimit } from "./metrics";
import {
  buildAwardedReferrerMetricsRevShareLimit,
  buildRankedReferrerMetricsRevShareLimit,
  buildReferrerMetricsRevShareLimit,
} from "./metrics";
import type { ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * Represents a leaderboard with the rev-share-limit award model for any number of referrers.
 */
export interface ReferrerLeaderboardRevShareLimit {
  /**
   * Discriminant identifying this as a rev-share-limit leaderboard.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareLimit}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareLimit;

  /**
   * The rules of the referral program that generated the {@link ReferrerLeaderboardRevShareLimit}.
   */
  rules: ReferralProgramRulesRevShareLimit;

  /**
   * The {@link AggregatedReferrerMetricsRevShareLimit} for all {@link RankedReferrerMetricsRevShareLimit} values in `referrers`.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit;

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
  referrers: Map<Address, AwardedReferrerMetricsRevShareLimit>;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboardRevShareLimit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

export const buildReferrerLeaderboardRevShareLimit = (
  allReferrers: ReferrerMetrics[],
  rules: ReferralProgramRulesRevShareLimit,
  accurateAsOf: UnixTimestamp,
): ReferrerLeaderboardRevShareLimit => {
  assertLeaderboardInputs(allReferrers, rules, accurateAsOf);

  const sortedReferrers = sortReferrerMetrics(allReferrers);

  const revShareMetrics = sortedReferrers.map((r) => buildReferrerMetricsRevShareLimit(r));

  const rankedReferrers = revShareMetrics.map((r, index) =>
    buildRankedReferrerMetricsRevShareLimit(r, index + 1, rules),
  );

  const { aggregatedMetrics, scalingFactor } = buildAggregatedReferrerMetricsRevShareLimit(
    rankedReferrers,
    rules,
  );

  const awardedReferrers = rankedReferrers.map((r) =>
    buildAwardedReferrerMetricsRevShareLimit(r, rules, scalingFactor),
  );

  const referrers = new Map(awardedReferrers.map((r) => [r.referrer, r]));

  return { awardModel: rules.awardModel, rules, aggregatedMetrics, referrers, accurateAsOf };
};
