import type {
  ReferralEditionSnapshotPieSplit,
  ReferrerLeaderboardPieSplit,
} from "./award-models/pie-split/leaderboard";
import type {
  ReferralEditionSnapshotRevShareCap,
  ReferrerLeaderboardRevShareCap,
} from "./award-models/rev-share-cap/leaderboard";

/**
 * Represents a leaderboard for any number of referrers.
 *
 * Use `awardModel` to narrow the specific variant at runtime.
 */
export type ReferrerLeaderboard = ReferrerLeaderboardPieSplit | ReferrerLeaderboardRevShareCap;

/**
 * A point-in-time snapshot of everything computed for a referral program edition.
 *
 * Use `awardModel` to narrow the specific variant at runtime.
 */
export type ReferralEditionSnapshot =
  | ReferralEditionSnapshotPieSplit
  | ReferralEditionSnapshotRevShareCap;
