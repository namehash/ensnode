import {
  buildReferrerLeaderboard,
  type ReferralProgramRules,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";

import { getReferrerMetrics } from "./database";

/**
 * Builds a `ReferralLeaderboard` from the database using the provided referral program rules.
 *
 * @param rules - The referral program rules for filtering registrar actions
 * @returns A promise that resolves to a {@link ReferrerLeaderboard}
 * @throws Error if the database query fails
 */
export async function getReferrerLeaderboard(
  rules: ReferralProgramRules,
): Promise<ReferrerLeaderboard> {
  const allReferrers = await getReferrerMetrics(rules);
  return buildReferrerLeaderboard(allReferrers, rules);
}
