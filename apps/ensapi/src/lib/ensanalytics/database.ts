import {
  buildReferralProgramRules,
  buildReferrerLeaderboard,
  buildReferrerMetrics,
  type ReferrerLeaderboard,
  type USDQuantity,
} from "@namehash/ens-referrals";
import { and, count, desc, eq, gte, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import { zeroAddress } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type AccountId,
  deserializeDuration,
  serializeAccountId,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import logger from "@/lib/logger";

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
     * Step 2: Filter for qualified referrals where:
     * - timestamp is between startDate and endDate
     * - decodedReferrer is not null and not the zero address
     * - subregistryId matches the provided subregistryId
     *
     * Step 3: Group by decodedReferrer and calculate:
     * - Sum total incrementalDuration for each decodedReferrer
     * - Count of qualified referrals for each decodedReferrer
     *
     * Step 4: Sort by sum total incrementalDuration from highest to lowest
     */
    const result = await db
      .select({
        referrer: schema.registrarActions.decodedReferrer,
        totalReferrals: count().as("total_referrals"),
        totalIncrementalDuration: sum(schema.registrarActions.incrementalDuration).as(
          "total_incremental_duration",
        ),
      })
      .from(schema.registrarActions)
      .where(
        and(
          // Filter by timestamp range
          gte(schema.registrarActions.timestamp, BigInt(startTime)),
          lte(schema.registrarActions.timestamp, BigInt(endTime)),
          // Filter by decodedReferrer not null
          isNotNull(schema.registrarActions.decodedReferrer),
          // Filter by decodedReferrer not zero address
          ne(schema.registrarActions.decodedReferrer, zeroAddress),
          // Filter by subregistryId matching the provided subregistryId
          eq(schema.registrarActions.subregistryId, serializeAccountId(subregistryId)),
        ),
      )
      .groupBy(schema.registrarActions.decodedReferrer)
      .orderBy(desc(sql`total_incremental_duration`));

    /**
     * Step 5: Build referrer metrics from database response.
     */
    const allReferrers = result.map((row) => {
      return buildReferrerMetrics(
        // biome-ignore lint/style/noNonNullAssertion: referrer is guaranteed to be non-null due to isNotNull filter in WHERE clause
        row.referrer!,
        row.totalReferrals,
        // biome-ignore lint/style/noNonNullAssertion: totalIncrementalDuration is guaranteed to be non-null as it is the sum of non-null bigint values
        deserializeDuration(row.totalIncrementalDuration!),
      );
    });

    /**
     * Step 6: Build leaderboard from all referrer metrics.
     */
    return buildReferrerLeaderboard(allReferrers, rules, chainIndexingStatusCursor);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch referrers from database");
    throw new Error(`Failed to fetch referrers from database: ${errorMessage}`);
  }
}
