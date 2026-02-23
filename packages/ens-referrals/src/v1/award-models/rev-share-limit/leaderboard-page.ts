import { calcReferralProgramStatus } from "../../status";
import {
  type BaseReferrerLeaderboardPage,
  type ReferrerLeaderboardPageContext,
  sliceReferrers,
} from "../shared/leaderboard-page";
import type { AggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import type { ReferrerLeaderboardRevShareLimit } from "./leaderboard";
import type { AwardedReferrerMetricsRevShareLimit } from "./metrics";
import type { ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * A page of referrers from the rev-share-limit referrer leaderboard.
 */
export interface ReferrerLeaderboardPageRevShareLimit extends BaseReferrerLeaderboardPage {
  /**
   * The {@link ReferralProgramRulesRevShareLimit} used to generate the {@link ReferrerLeaderboard}
   * that this {@link ReferrerLeaderboardPageRevShareLimit} comes from.
   */
  rules: ReferralProgramRulesRevShareLimit;

  /**
   * Ordered list of {@link AwardedReferrerMetricsRevShareLimit} for the {@link ReferrerLeaderboardPageRevShareLimit}
   * described by {@link pageContext} within the related {@link ReferrerLeaderboard}.
   *
   * @invariant Array will be empty if `pageContext.totalRecords` is 0.
   * @invariant Array entries are ordered by `rank` (ascending).
   */
  referrers: AwardedReferrerMetricsRevShareLimit[];

  /**
   * The aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit;
}

export function buildLeaderboardPageRevShareLimit(
  pageContext: ReferrerLeaderboardPageContext,
  leaderboard: ReferrerLeaderboardRevShareLimit,
): ReferrerLeaderboardPageRevShareLimit {
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
