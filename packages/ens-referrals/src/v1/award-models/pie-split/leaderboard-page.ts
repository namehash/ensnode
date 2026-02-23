import { calcReferralProgramStatus } from "../../status";
import {
  type BaseReferrerLeaderboardPage,
  type ReferrerLeaderboardPageContext,
  sliceReferrers,
} from "../shared/leaderboard-page";
import type { AggregatedReferrerMetricsPieSplit } from "./aggregations";
import type { ReferrerLeaderboardPieSplit } from "./leaderboard";
import type { AwardedReferrerMetricsPieSplit } from "./metrics";
import type { ReferralProgramRulesPieSplit } from "./rules";

/**
 * A page of referrers from the pie-split referrer leaderboard.
 */
export interface ReferrerLeaderboardPagePieSplit extends BaseReferrerLeaderboardPage {
  /**
   * The {@link ReferralProgramRulesPieSplit} used to generate the {@link ReferrerLeaderboardPieSplit}
   * that this {@link ReferrerLeaderboardPagePieSplit} comes from.
   */
  rules: ReferralProgramRulesPieSplit;

  /**
   * Ordered list of {@link AwardedReferrerMetricsPieSplit} for the {@link ReferrerLeaderboardPagePieSplit}
   * described by {@link pageContext} within the related {@link ReferrerLeaderboardPieSplit}.
   *
   * @invariant Array will be empty if `pageContext.totalRecords` is 0.
   * @invariant Array entries are ordered by `rank` (ascending).
   */
  referrers: AwardedReferrerMetricsPieSplit[];

  /**
   * The aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsPieSplit;
}

export function buildLeaderboardPagePieSplit(
  pageContext: ReferrerLeaderboardPageContext,
  leaderboard: ReferrerLeaderboardPieSplit,
): ReferrerLeaderboardPagePieSplit {
  const status = calcReferralProgramStatus(leaderboard.rules, leaderboard.accurateAsOf);
  return {
    rules: leaderboard.rules,
    referrers: sliceReferrers(leaderboard.referrers, pageContext),
    aggregatedMetrics: leaderboard.aggregatedMetrics,
    pageContext,
    status,
    accurateAsOf: leaderboard.accurateAsOf,
  };
}
