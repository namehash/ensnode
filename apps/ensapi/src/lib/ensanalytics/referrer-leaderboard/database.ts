import { and, count, desc, eq, gte, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import { type Address, zeroAddress } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import { type AccountId, serializeAccountId, type UnixTimestamp } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

export type ReferrerLeaderboardRecord = {
  referrer: Address;

  totalReferrals: number;

  totalIncrementalDuration: string;
};

/**
 * Get Referrer Leaderboard Records
 *
 * @param startTime - The start time (inclusive) for filtering registrar actions
 * @param endTime - The end time (inclusive) for filtering registrar actions
 * @param subregistryId - The account ID of the subregistry for filtering registrar actions
 * @returns A promise that resolves to a list of {@link ReferrerLeaderboardRecord}s.
 * @throws Error if the database query fails.
 */
export async function getReferrerLeaderboardRecords(
  subregistryId: AccountId,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
): Promise<ReferrerLeaderboardRecord[]> {
  /**
   * Step 1: Filter for qualified referrals where:
   * - timestamp is between startDate and endDate
   * - decodedReferrer is not null and not the zero address
   * - subregistryId matches the provided subregistryId
   *
   * Step 2: Group by decodedReferrer and calculate:
   * - Sum total incrementalDuration for each decodedReferrer
   * - Count of qualified referrals for each decodedReferrer
   *
   * Step 3: Sort by sum total incrementalDuration from highest to lowest
   */
  const records = db
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

  // Set type with no nullables due to the following guarantees for each record:
  // 1. `referrer` is guaranteed to be non-null due to isNotNull filter in WHERE clause.
  // 2. `totalIncrementalDuration` is guaranteed to be non-null as it is the sum of non-null bigint values
  return records as Promise<ReferrerLeaderboardRecord[]>;
}
