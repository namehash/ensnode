import {
  type BaseReferrerLeaderboardPage,
  type ReferrerLeaderboardPageContext,
  sliceReferrers,
} from "../shared/leaderboard-page";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { AggregatedReferrerMetricsRevShareCap } from "./aggregations";
import type { ReferrerLeaderboardRevShareCap } from "./leaderboard";
import type { AwardedReferrerMetricsRevShareCap } from "./metrics";
import type { ReferralProgramRulesRevShareCap } from "./rules";
import { calcReferralProgramEditionStatusRevShareCap } from "./status";

/**
 * A page of referrers from the rev-share-cap referrer leaderboard.
 */
export interface ReferrerLeaderboardPageRevShareCap extends BaseReferrerLeaderboardPage {
  /**
   * Discriminant identifying this as a page from a rev-share-cap leaderboard.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareCap}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

  /**
   * The {@link ReferralProgramRulesRevShareCap} used to generate the {@link ReferrerLeaderboardRevShareCap}
   * that this {@link ReferrerLeaderboardPageRevShareCap} comes from.
   */
  rules: ReferralProgramRulesRevShareCap;

  /**
   * Ordered list of {@link AwardedReferrerMetricsRevShareCap} for the {@link ReferrerLeaderboardPageRevShareCap}
   * described by {@link pageContext} within the related {@link ReferrerLeaderboard}.
   *
   * @invariant Array will be empty if `pageContext.totalRecords` is 0.
   * @invariant Array entries are ordered by `rank` (ascending).
   */
  referrers: AwardedReferrerMetricsRevShareCap[];

  /**
   * The aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareCap;
}

export function buildLeaderboardPageRevShareCap(
  pageContext: ReferrerLeaderboardPageContext,
  leaderboard: ReferrerLeaderboardRevShareCap,
): ReferrerLeaderboardPageRevShareCap {
  const status = calcReferralProgramEditionStatusRevShareCap(
    leaderboard.rules,
    leaderboard.accurateAsOf,
    leaderboard.aggregatedMetrics,
  );
  return {
    awardModel: leaderboard.awardModel,
    rules: leaderboard.rules,
    referrers: sliceReferrers(leaderboard.referrers, pageContext),
    aggregatedMetrics: leaderboard.aggregatedMetrics,
    pageContext,
    status,
    accurateAsOf: leaderboard.accurateAsOf,
  };
}
