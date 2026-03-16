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
  type ReferrerLeaderboardPageUnrecognized,
} from "./award-models/shared/leaderboard-page";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferrerLeaderboard } from "./leaderboard";

/**
 * A page of referrers from the referrer leaderboard.
 *
 * Use `awardModel` to narrow the specific variant at runtime. Within each variant,
 * `rules`, `referrers`, and `aggregatedMetrics` are all guaranteed to be from the same model.
 * When `awardModel` is `"unrecognized"`, the page was produced by a server running a newer
 * version — use {@link ReferrerLeaderboardPageUnrecognized} to access `originalAwardModel`.
 */
export type ReferrerLeaderboardPage =
  | ReferrerLeaderboardPagePieSplit
  | ReferrerLeaderboardPageRevShareLimit
  | ReferrerLeaderboardPageUnrecognized;

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

    default: {
      const _exhaustiveCheck: never = leaderboard;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerLeaderboard).awardModel}`,
      );
    }
  }
};
