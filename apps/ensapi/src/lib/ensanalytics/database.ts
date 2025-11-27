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
import type { AggregatedReferrerSnapshot } from "@/lib/ensanalytics/types";
import { ireduce } from "@/lib/itertools";
import logger from "@/lib/logger";

/**
 * Fetches all referrers with 1 or more qualified referrals from the `registrar_actions` table
 * and builds an `AggregatedReferrerSnapshot`.
 *
 * Step 1: Filter for "qualified" referrals where:
 * - timestamp is between startDate and endDate
 * - decodedReferrer is not null and not the zero address
 * - subregistryId matches the provided subregistryId
 *
 * Step 2: Group by decodedReferrer and calculate:
 * - Sum total incrementalDuration for each decodedReferrer
 * - Count of qualified referrals for each decodedReferrer
 *
 * Step 3: Sort by sum total incrementalDuration from highest to lowest
 *
 * Step 4: Calculate grand totals and build the snapshot object
 *
 * @param startDate - The start date (Unix timestamp, inclusive) for filtering registrar actions
 * @param endDate - The end date (Unix timestamp, inclusive) for filtering registrar actions
 * @param subregistryId - The account ID of the subregistry to filter by
 * @param updatedAt - The timestamp to use for the snapshot's updatedAt field
 * @returns `AggregatedReferrerSnapshot` containing all referrers with at least one qualified referral, grand totals, and updatedAt timestamp
 * @throws Error if startDate > endDate (invalid date range)
 * @throws Error if the database query fails
 */
export async function getAggregatedReferrerSnapshot(
  startDate: UnixTimestamp,
  endDate: UnixTimestamp,
  subregistryId: AccountId,
  updatedAt: UnixTimestamp,
): Promise<AggregatedReferrerSnapshot> {
  if (startDate > endDate) {
    throw new Error(
      `Invalid date range: startDate (${startDate}) must be less than or equal to endDate (${endDate})`,
    );
  }

  try {
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
          gte(schema.registrarActions.timestamp, BigInt(startDate)),
          lte(schema.registrarActions.timestamp, BigInt(endDate)),
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

    // Transform the result to an ordered map (preserves SQL sort order)
    const referrers = new Map(
      result.map((row) => {
        // biome-ignore lint/style/noNonNullAssertion: referrer is guaranteed to be non-null due to isNotNull filter in WHERE clause
        const address = row.referrer!;
        const metrics = {
          referrer: address,
          totalReferrals: row.totalReferrals,
          // biome-ignore lint/style/noNonNullAssertion: totalIncrementalDuration is guaranteed to be non-null as it is the sum of non-null bigint values
          totalIncrementalDuration: deserializeDuration(row.totalIncrementalDuration!),
        };
        return [address, metrics];
      }),
    );

    // Calculate grand totals across all referrers
    const grandTotalReferrals = ireduce(
      referrers.values(),
      (sum, metrics) => sum + metrics.totalReferrals,
      0,
    );
    const grandTotalIncrementalDuration = ireduce(
      referrers.values(),
      (sum, metrics) => sum + metrics.totalIncrementalDuration,
      0,
    );

    // Build and return the complete snapshot
    return {
      referrers,
      updatedAt,
      grandTotalReferrals,
      grandTotalIncrementalDuration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch aggregated referrer snapshot from database");
    throw new Error(`Failed to fetch aggregated referrer snapshot: ${errorMessage}`);
  }
}
