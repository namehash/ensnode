import type { ReferrerLeaderboardPieSplit } from "./award-models/pie-split/leaderboard";
import type { ReferrerLeaderboardRevShareLimit } from "./award-models/rev-share-limit/leaderboard";

/**
 * Represents a leaderboard for any number of referrers.
 *
 * Use `awardModel` to narrow the specific variant at runtime.
 */
export type ReferrerLeaderboard = ReferrerLeaderboardPieSplit | ReferrerLeaderboardRevShareLimit;
