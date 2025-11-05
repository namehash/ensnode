import { and, count, desc, gte, lt, sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";

import { db } from "@/lib/db";
import logger from "@/lib/logger";

import type { ReferrerData } from "./types";
import { getUnixTime } from "date-fns";

const START_DATE = getUnixTime(new Date("2025-01-01T00:00:00.000Z"));
const END_DATE = getUnixTime(new Date("2026-01-01T00:00:00.000Z"));

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
    const result = await db
      .select({
        referrer: schema.registrationReferral.referrer,
        totalReferrals: count().as("total_referrals"),
      })
      .from(schema.registrationReferral)
      .where(
        and(
          gte(schema.registrationReferral.timestamp, BigInt(START_DATE)),
          lt(schema.registrationReferral.timestamp, BigInt(END_DATE)),
        ),
      )
      .groupBy(schema.registrationReferral.referrer)
      .orderBy(desc(sql`total_referrals`));

    return result as ReferrerData[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch top referrers from database");
    throw new Error(`Failed to fetch top referrers: ${errorMessage}`);
  }
}
