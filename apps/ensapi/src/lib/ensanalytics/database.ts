import config from "@/config";

import { getUnixTime } from "date-fns";
import { and, count, desc, eq, gte, isNotNull, lt, ne, sql, sum } from "drizzle-orm";
import { type Address, zeroAddress } from "viem";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import * as schema from "@ensnode/ensnode-schema";
import { type AccountId, deserializeDuration, serializeAccountId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import type { ReferrerData } from "@/lib/ensanalytics/types";
import logger from "@/lib/logger";

const START_DATE = getUnixTime(new Date("2025-01-01T00:00:00.000Z"));
const END_DATE = getUnixTime(new Date("2026-01-01T00:00:00.000Z"));

/**
 * Gets the BaseRegistrar contract AccountId for the configured namespace.
 *
 * @returns The AccountId for the BaseRegistrar contract
 * @throws Error if the contract is not found
 */
function getBaseRegistrarSubregistryId(): AccountId {
  const datasource = maybeGetDatasource(config.namespace, DatasourceNames.ENSRoot);
  if (!datasource) {
    throw new Error(`Datasource not found for ${config.namespace} ${DatasourceNames.ENSRoot}`);
  }

  const address = datasource.contracts.BaseRegistrar?.address;
  if (address === undefined || Array.isArray(address)) {
    throw new Error(
      `BaseRegistrar contract not found or has multiple addresses for ${config.namespace}`,
    );
  }

  return {
    chainId: datasource.chain.id,
    address,
  };
}

/**
 * Fetches the top referrers from the registrar_actions table.
 *
 * Step 1: Filter for "qualified" registrar actions where:
 * - timestamp is between START_DATE and END_DATE
 * - decodedReferrer is not null and not the zero address
 * - subregistryId matches the .eth BaseRegistrar contract
 *
 * Step 2: Group by decodedReferrer and calculate:
 * - Sum total incrementalDuration for each decodedReferrer
 * - Count of qualified registrar actions
 *
 * Step 3: Sort by sum total incrementalDuration from highest to lowest
 *
 * @returns Array of referrer data sorted by total incremental duration (descending)
 * @throws Error if the database query fails
 */
export async function getTopReferrers(): Promise<ReferrerData[]> {
  try {
    const subregistryId = getBaseRegistrarSubregistryId();

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
          gte(schema.registrarActions.timestamp, BigInt(START_DATE)),
          lt(schema.registrarActions.timestamp, BigInt(END_DATE)),
          // Filter by decodedReferrer not null
          isNotNull(schema.registrarActions.decodedReferrer),
          // Filter by decodedReferrer not zero address
          ne(schema.registrarActions.decodedReferrer, zeroAddress),
          // Filter by subregistryId matching .eth BaseRegistrar
          eq(schema.registrarActions.subregistryId, serializeAccountId(subregistryId)),
        ),
      )
      .groupBy(schema.registrarActions.decodedReferrer)
      .orderBy(desc(sql`total_incremental_duration`));

    // Transform the result to match ReferrerData interface
    // Note: referrer is guaranteed to be non-null due to isNotNull filter in WHERE clause
    return result.map((row) => ({
      referrer: row.referrer as Address,
      totalReferrals: Number(row.totalReferrals),
      totalIncrementalDuration: deserializeDuration(row.totalIncrementalDuration ?? 0),
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch top referrers from database");
    throw new Error(`Failed to fetch top referrers: ${errorMessage}`);
  }
}
