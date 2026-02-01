import {
  buildReferrerMetrics,
  type ReferralProgramRules,
  type ReferrerMetrics,
} from "@namehash/ens-referrals/v1";
import { and, count, desc, eq, gte, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import { type Address, zeroAddress } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import { deserializeDuration, formatAccountId, priceEth } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import logger from "@/lib/logger";

/**
 * Get Referrer Metrics from the database (V1 API).
 *
 * @param rules - The referral program rules for filtering registrar actions
 * @returns A promise that resolves to an array of {@link ReferrerMetrics} values.
 * @throws Error if the database query fails.
 */
export const getReferrerMetrics = async (
  rules: ReferralProgramRules,
): Promise<ReferrerMetrics[]> => {
  /**
   * Step 1: Filter for referrals matching the provided rules:
   * - timestamp is between startDate and endDate (inclusive)
   * - decodedReferrer is not null and not the zero address
   * - subregistryId matches the provided subregistryId
   *
   * Step 2: Group by decodedReferrer and calculate:
   * - Sum total incrementalDuration for each decodedReferrer
   * - Count of qualified referrals for each decodedReferrer
   * - Sum total cost (revenue contribution) for each decodedReferrer
   *
   * Step 3: Sort by sum total incrementalDuration from highest to lowest
   */

  try {
    const records = await db
      .select({
        referrer: schema.registrarActions.decodedReferrer,
        totalReferrals: count().as("total_referrals"),
        totalIncrementalDuration: sum(schema.registrarActions.incrementalDuration).as(
          "total_incremental_duration",
        ),
        // Note: Using raw SQL for COALESCE because Drizzle doesn't natively support it yet.
        // See: https://github.com/drizzle-team/drizzle-orm/issues/3708
        totalRevenueContribution:
          sql<string>`COALESCE(SUM(${schema.registrarActions.total}), 0)`.as(
            "total_revenue_contribution",
          ),
      })
      .from(schema.registrarActions)
      .where(
        and(
          // Filter by timestamp range
          gte(schema.registrarActions.timestamp, BigInt(rules.startTime)),
          lte(schema.registrarActions.timestamp, BigInt(rules.endTime)),
          // Filter by decodedReferrer not null
          isNotNull(schema.registrarActions.decodedReferrer),
          // Filter by decodedReferrer not zero address
          ne(schema.registrarActions.decodedReferrer, zeroAddress),
          // Filter by subregistryId matching the provided subregistryId
          eq(schema.registrarActions.subregistryId, formatAccountId(rules.subregistryId)),
        ),
      )
      .groupBy(schema.registrarActions.decodedReferrer)
      .orderBy(desc(sql`total_incremental_duration`));

    // Type assertion: The WHERE clause in the query above guarantees non-null values for:
    // 1. `referrer` is guaranteed to be non-null due to isNotNull filter
    // 2. `totalIncrementalDuration` is guaranteed to be non-null as it is the sum of non-null bigint values
    // 3. `totalRevenueContribution` is guaranteed to be non-null due to COALESCE with 0
    interface NonNullRecord {
      referrer: Address;
      totalReferrals: number;
      totalIncrementalDuration: string;
      totalRevenueContribution: string;
    }

    return (records as NonNullRecord[]).map((record) => {
      return buildReferrerMetrics(
        record.referrer,
        record.totalReferrals,
        deserializeDuration(record.totalIncrementalDuration),
        priceEth(BigInt(record.totalRevenueContribution)),
      );
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch referrer metrics from database");
    throw new Error(`Failed to fetch referrer metrics from database: ${errorMessage}`);
  }
};
