import {
  buildReferrerLeaderboardPieSplit,
  buildReferrerLeaderboardRevShareLimit,
  ReferralProgramAwardModels,
  type ReferralProgramRules,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals/v1";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { getReferralEvents, getReferrerMetrics } from "./database-v1";

/**
 * Builds a `ReferralLeaderboard` from the database using the provided referral program rules (V1 API).
 *
 * Dispatches to the appropriate model-specific builder based on `rules.awardModel`:
 * - PieSplit: uses aggregated referrer metrics (GROUP BY query).
 * - RevShareLimit: uses raw referral events (no GROUP BY) for the sequential race algorithm.
 *
 * @param rules - The referral program rules for filtering registrar actions
 * @param accurateAsOf - The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboard} was accurate as of.
 * @returns A promise that resolves to a {@link ReferrerLeaderboard}
 * @throws Error if the database query fails
 */
export async function getReferrerLeaderboard(
  rules: ReferralProgramRules,
  accurateAsOf: UnixTimestamp,
): Promise<ReferrerLeaderboard> {
  switch (rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit: {
      const allReferrers = await getReferrerMetrics(rules);
      return buildReferrerLeaderboardPieSplit(allReferrers, rules, accurateAsOf);
    }
    case ReferralProgramAwardModels.RevShareLimit: {
      const events = await getReferralEvents(rules);
      return buildReferrerLeaderboardRevShareLimit(events, rules, accurateAsOf);
    }
  }
}
