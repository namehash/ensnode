import {
  buildReferralProgramRules,
  buildReferrerLeaderboard,
  buildReferrerMetrics,
  type ReferrerLeaderboard,
  type USDQuantity,
} from "@namehash/ens-referrals";

import { type AccountId, deserializeDuration, type UnixTimestamp } from "@ensnode/ensnode-sdk";

import logger from "@/lib/logger";

import { getReferrerLeaderboardRecords } from "./database";

/**
 * Builds a `ReferralLeaderboard` from all database records in the `registrar_actions` table
 * matching the provided filters.
 *
 * @param startTime - The start time (inclusive) for filtering registrar actions
 * @param endTime - The end time (inclusive) for filtering registrar actions
 * @param subregistryId - The account ID of the subregistry for filtering registrar actions
 * @param chainIndexingStatusCursor - the current chain indexing status cursor for the chain that
 *                                    that is the source of referrer actions associated with subregistryId.
 * @returns A promise that resolves to a {@link ReferrerLeaderboard}
 * @throws Error if startTime > endTime (invalid time range)
 * @throws Error if the database query fails
 */
export async function getReferrerLeaderboard(
  totalAwardPoolValue: USDQuantity,
  maxQualifiedReferrers: number,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
  subregistryId: AccountId,
  chainIndexingStatusCursor: UnixTimestamp,
): Promise<ReferrerLeaderboard> {
  /**
   * Step 1: Build referral program rules.
   */
  const rules = buildReferralProgramRules(
    totalAwardPoolValue,
    maxQualifiedReferrers,
    startTime,
    endTime,
  );

  try {
    /**
     * Step 2: Get Referrer Leaderboard records
     */
    const result = await getReferrerLeaderboardRecords(subregistryId, startTime, endTime);

    /**
     * Step 3: Build referrer metrics from database response.
     */
    const allReferrers = result.map((row) => {
      return buildReferrerMetrics(
        row.referrer,
        row.totalReferrals,
        deserializeDuration(row.totalIncrementalDuration),
      );
    });

    /**
     * Step 4: Build leaderboard from all referrer metrics.
     */
    return buildReferrerLeaderboard(allReferrers, rules, chainIndexingStatusCursor);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch referrers from database");
    throw new Error(`Failed to fetch referrers from database: ${errorMessage}`);
  }
}
