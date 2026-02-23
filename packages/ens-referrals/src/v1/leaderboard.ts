import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import {
  buildReferrerLeaderboardPieSplit,
  type ReferrerLeaderboardPieSplit,
} from "./award-models/pie-split/leaderboard";
import {
  buildReferrerLeaderboardRevShareLimit,
  type ReferrerLeaderboardRevShareLimit,
} from "./award-models/rev-share-limit/leaderboard";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferrerMetrics } from "./referrer-metrics";
import type { ReferralProgramRules } from "./rules";

/**
 * Represents a leaderboard for any number of referrers.
 *
 * Use `awardModel` to narrow the specific variant at runtime.
 */
export type ReferrerLeaderboard = ReferrerLeaderboardPieSplit | ReferrerLeaderboardRevShareLimit;

export const buildReferrerLeaderboard = (
  allReferrers: ReferrerMetrics[],
  rules: ReferralProgramRules,
  accurateAsOf: UnixTimestamp,
): ReferrerLeaderboard => {
  switch (rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return buildReferrerLeaderboardPieSplit(allReferrers, rules, accurateAsOf);
    case ReferralProgramAwardModels.RevShareLimit:
      return buildReferrerLeaderboardRevShareLimit(allReferrers, rules, accurateAsOf);
  }
};
