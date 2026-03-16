import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { ReferrerMetrics } from "../../referrer-metrics";
import type { BaseReferralProgramRules } from "./rules";

/**
 * Asserts invariants that must hold for any leaderboard builder regardless of award model.
 */
export const assertLeaderboardInputs = (
  allReferrers: ReferrerMetrics[],
  rules: BaseReferralProgramRules,
  accurateAsOf: UnixTimestamp,
): void => {
  const uniqueReferrers = new Set(allReferrers.map((r) => r.referrer));
  if (uniqueReferrers.size !== allReferrers.length) {
    throw new Error(
      "ReferrerLeaderboard: Cannot build a leaderboard containing duplicate referrers",
    );
  }

  if (accurateAsOf < rules.startTime && allReferrers.length > 0) {
    throw new Error(
      `ReferrerLeaderboard: accurateAsOf (${accurateAsOf}) is before startTime (${rules.startTime}) which indicates allReferrers should be empty, but allReferrers is not empty.`,
    );
  }
};
