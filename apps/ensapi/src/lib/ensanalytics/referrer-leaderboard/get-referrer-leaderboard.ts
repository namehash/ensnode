import {
  buildReferrerLeaderboardPieSplit,
  buildReferrerLeaderboardRevShareCap,
  ReferralProgramAwardModels,
  type ReferralProgramRules,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";
import type { UnixTimestamp } from "enssdk";

import { getReferralEvents, getReferrerMetrics } from "./database";

/**
 * Builds a {@link ReferrerLeaderboard} from the database using the provided referral program rules.
 *
 * Dispatches to the appropriate model-specific builder based on `rules.awardModel`:
 * - PieSplit: uses aggregated referrer metrics (GROUP BY query).
 * - RevShareCap: uses raw referral events (no GROUP BY) for the sequential race algorithm.
 *
 * @param rules - The referral program rules for filtering registrar actions
 * @param accurateAsOf - The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboard} was accurate as of.
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
    case ReferralProgramAwardModels.RevShareCap: {
      const events = await getReferralEvents(rules);
      return buildReferrerLeaderboardRevShareCap(events, rules, accurateAsOf);
    }
    case ReferralProgramAwardModels.Unrecognized:
      // ReferralProgramRulesUnrecognized editions are filtered at cache-init time
      // and should never reach this function.
      throw new Error(
        `getReferrerLeaderboard called with unrecognized award model '${rules.originalAwardModel}' — edition should have been filtered before reaching this point.`,
      );

    default: {
      const _exhaustiveCheck: never = rules;
      throw new Error(
        `Unexpected award model in getReferrerLeaderboard: ${(_exhaustiveCheck as ReferralProgramRules).awardModel}`,
      );
    }
  }
}
