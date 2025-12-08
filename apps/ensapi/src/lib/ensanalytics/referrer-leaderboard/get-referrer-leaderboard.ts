import {
  buildReferrerLeaderboard,
  type ReferralProgramRules,
  type ReferrerLeaderboard,
  type UnixTimestamp,
} from "@namehash/ens-referrals";

import { getReferrerMetrics } from "./database";

/**
 * Builds a `ReferralLeaderboard` from the database using the provided referral program rules.
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
  const allReferrers = await getReferrerMetrics(rules);
  return buildReferrerLeaderboard(allReferrers, rules, accurateAsOf);
}
