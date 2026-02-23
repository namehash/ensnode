import type { ReferrerLeaderboardPieSplit } from "./award-models/pie-split/leaderboard";
import {
  buildLeaderboardPagePieSplit,
  type ReferrerLeaderboardPagePieSplit,
} from "./award-models/pie-split/leaderboard-page";
import type { ReferrerLeaderboardRevShareLimit } from "./award-models/rev-share-limit/leaderboard";
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
 * Use `rules.awardModel` to determine the specific variant at runtime. Within each variant,
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

  switch (leaderboard.rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      // Single type assertion per branch: rules.awardModel === "pie-split" guarantees the leaderboard
      // is ReferrerLeaderboardPieSplit, but TypeScript cannot narrow a union on a nested property.
      return buildLeaderboardPagePieSplit(pageContext, leaderboard as ReferrerLeaderboardPieSplit);
    case ReferralProgramAwardModels.RevShareLimit:
      return buildLeaderboardPageRevShareLimit(
        pageContext,
        leaderboard as ReferrerLeaderboardRevShareLimit,
      );
  }
};
