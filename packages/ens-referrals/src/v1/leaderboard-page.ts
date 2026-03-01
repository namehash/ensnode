import {
  buildLeaderboardPagePieSplit,
  type ReferrerLeaderboardPagePieSplit,
} from "./award-models/pie-split/leaderboard-page";
import {
  buildLeaderboardPageRevShareLimit,
  type ReferrerLeaderboardPageRevShareLimit,
} from "./award-models/rev-share-limit/leaderboard-page";
import {
  buildReferrerLeaderboardPageContext,
  type ReferrerLeaderboardPageParams,
} from "./award-models/shared/leaderboard-page";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferrerLeaderboard } from "./leaderboard";

/**
 * A page of referrers from the referrer leaderboard.
 *
 * Use `awardModel` to narrow the specific variant at runtime. Within each variant,
 * `rules`, `referrers`, and `aggregatedMetrics` are all guaranteed to be from the same model.
 */
export type ReferrerLeaderboardPage =
  | ReferrerLeaderboardPagePieSplit
  | ReferrerLeaderboardPageRevShareLimit;

export const getReferrerLeaderboardPage = (
  pageParams: ReferrerLeaderboardPageParams,
  leaderboard: ReferrerLeaderboard,
): ReferrerLeaderboardPage => {
  const pageContext = buildReferrerLeaderboardPageContext(pageParams, leaderboard);

  switch (leaderboard.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return buildLeaderboardPagePieSplit(pageContext, leaderboard);
    case ReferralProgramAwardModels.RevShareLimit:
      return buildLeaderboardPageRevShareLimit(pageContext, leaderboard);
  }
};
