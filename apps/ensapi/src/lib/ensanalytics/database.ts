import { getUnixTime } from "date-fns";
import { and, count, desc, eq, gte, isNotNull, lt, ne, sql, sum } from "drizzle-orm";
import { zeroAddress } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  deserializeDuration,
  serializeAccountId,
  type AccountId,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import type { TopReferrersSnapshot } from "@/lib/ensanalytics/types";
import logger from "@/lib/logger";


/**
 * Fetches the top referrers from the registrar_actions table and builds a snapshot.
 *
 * Step 1: Filter for "qualified" registrar actions where:
 * - timestamp is between startDate and endDate
 * - decodedReferrer is not null and not the zero address
 * - subregistryId matches the provided subregistryId
 *
 * Step 2: Group by decodedReferrer and calculate:
 * - Sum total incrementalDuration for each decodedReferrer
 * - Count of qualified registrar actions
 *
 * Step 3: Sort by sum total incrementalDuration from highest to lowest
 *
 * Step 4: Calculate grand totals and build the snapshot object
 *
 * @param startDate - The start date (Unix timestamp) for filtering registrar actions
 * @param endDate - The end date (Unix timestamp) for filtering registrar actions
 * @param subregistryId - The account ID of the subregistry to filter by
 * @returns TopReferrersSnapshot containing referrer data, grand totals, and updatedAt timestamp
 * @throws Error if the database query fails
 */
export async function getTopReferrers(
  startDate: UnixTimestamp,
  endDate: UnixTimestamp,
  subregistryId: AccountId,
): Promise<TopReferrersSnapshot> {
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
          lt(schema.registrarActions.timestamp, BigInt(endDate)),
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

    // Transform the result to match AggregatedReferrerMetrics interface
    const topReferrers = result.map((row) => ({
      // biome-ignore lint/style/noNonNullAssertion:
      // referrer is guaranteed to be non-null due to isNotNull filter in WHERE clause
      referrer: row.referrer!,
      totalReferrals: row.totalReferrals,
      // biome-ignore lint/style/noNonNullAssertion:
      // totalIncrementalDuration is guaranteed to be non-null as it is the sum of non-null bigint values.
      totalIncrementalDuration: deserializeDuration(row.totalIncrementalDuration!),
    }));

    // Calculate grand totals across all referrers
    const grandTotalReferrals = topReferrers.reduce(
      (sum, referrer) => sum + referrer.totalReferrals,
      0,
    );
    const grandTotalIncrementalDuration = topReferrers.reduce(
      (sum, referrer) => sum + referrer.totalIncrementalDuration,
      0,
    );

    // Build and return the complete snapshot
    return {
      topReferrers,
      updatedAt: getUnixTime(new Date()),
      grandTotalReferrals,
      grandTotalIncrementalDuration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch top referrers from database");
    throw new Error(`Failed to fetch top referrers: ${errorMessage}`);
  }
}
