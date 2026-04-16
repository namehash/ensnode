import type { ReferrerLeaderboardPieSplit } from "./award-models/pie-split/leaderboard";
import type { ReferrerLeaderboardRevShareCap } from "./award-models/rev-share-cap/leaderboard";

/**
 * Represents a leaderboard for any number of referrers.
 *
 * Use `awardModel` to narrow the specific variant at runtime.
 */
export type ReferrerLeaderboard = ReferrerLeaderboardPieSplit | ReferrerLeaderboardRevShareCap;
