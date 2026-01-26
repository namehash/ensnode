import {
  buildReferrerLeaderboard,
  type ReferralProgramRules,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals/v1";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { getReferrerMetrics } from "./database-v1";

/**
 * Builds a `ReferralLeaderboard` from the database using the provided referral program rules (V1 API).
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
