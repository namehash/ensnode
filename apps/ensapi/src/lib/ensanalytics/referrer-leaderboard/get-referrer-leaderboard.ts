import {
  buildReferrerLeaderboard,
  type ReferralProgramRules,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { getReferrerMetrics } from "./database";

/**
 * Builds a `ReferralLeaderboard` from the database using the provided referral program rules.
 *
 * @param rules - The referral program rules for filtering registrar actions
 * @param chainIndexingStatusCursor - the current chain indexing status cursor for the chain that
 *                                    that is the source of referrer actions.
 * @returns A promise that resolves to a {@link ReferrerLeaderboard}
 * @throws Error if the database query fails
 */
export async function getReferrerLeaderboard(
  rules: ReferralProgramRules,
  chainIndexingStatusCursor: UnixTimestamp,
): Promise<ReferrerLeaderboard> {
  const allReferrers = await getReferrerMetrics(rules);
  return buildReferrerLeaderboard(allReferrers, rules, chainIndexingStatusCursor);
}
