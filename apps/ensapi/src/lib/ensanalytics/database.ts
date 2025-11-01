import config from "@/config";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import logger from "@/lib/logger";

import type { ReferrerData } from "./types";

// Date range for filtering referrals (2025-01-01 to 2026-01-01)
const START_DATE = new Date("2025-01-01T00:00:00.000Z");
const END_DATE = new Date("2026-01-01T00:00:00.000Z");

/**
 * Fetches the top referrers from the registration_referral table.
 * Query aggregates referrals by referrer address and orders by total count.
 * Filters registrations between 2025-01-01 (inclusive) and 2026-01-01 (exclusive).
 *
 * @returns Array of referrer data with addresses and total referral counts
 * @throws Error if the database query fails
 */
export async function getTopReferrers(): Promise<ReferrerData[]> {
  try {
    // Convert dates to Unix timestamps (in seconds)
    const startTimestamp = Math.floor(START_DATE.getTime() / 1000);
    const endTimestamp = Math.floor(END_DATE.getTime() / 1000);

    // Build query with fixed date range filter
    const query = sql`
      SELECT
        referrer,
        COUNT(*) AS total_referrals
      FROM
        ${sql.identifier(config.databaseSchemaName)}.registration_referral
      WHERE
        timestamp >= ${startTimestamp}
        AND timestamp < ${endTimestamp}
      GROUP BY
        referrer
      ORDER BY
        total_referrals DESC
    `;

    const result = await db.execute(query);
    return result.rows as ReferrerData[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch top referrers from database");
    throw new Error(`Failed to fetch top referrers: ${errorMessage}`);
  }
}
