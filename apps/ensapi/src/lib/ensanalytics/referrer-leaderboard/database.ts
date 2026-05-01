import {
  buildReferrerMetrics,
  type ReferralEvent,
  type ReferralProgramRules,
  type ReferrerMetrics,
} from "@namehash/ens-referrals";
import { and, asc, count, desc, eq, gte, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import {
  type Address,
  type InterpretedName,
  type NormalizedAddress,
  stringifyAccountId,
} from "enssdk";
import type { Hash } from "viem";
import { zeroAddress } from "viem";

import { deserializeDuration, priceEth, RegistrarActionTypes } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import logger from "@/lib/logger";

/**
 * Get Referrer Metrics from the database.
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
    const records = await ensDb
      .select({
        referrer: ensIndexerSchema.registrarActions.decodedReferrer,
        totalReferrals: count().as("total_referrals"),
        totalIncrementalDuration: sum(ensIndexerSchema.registrarActions.incrementalDuration).as(
          "total_incremental_duration",
        ),
        // Note: Using raw SQL for COALESCE because Drizzle doesn't natively support it yet.
        // See: https://github.com/drizzle-team/drizzle-orm/issues/3708
        totalRevenueContribution:
          sql<string>`COALESCE(SUM(${ensIndexerSchema.registrarActions.total}), 0)`.as(
            "total_revenue_contribution",
          ),
      })
      .from(ensIndexerSchema.registrarActions)
      .where(
        and(
          // Filter by timestamp range
          gte(ensIndexerSchema.registrarActions.timestamp, BigInt(rules.startTime)),
          lte(ensIndexerSchema.registrarActions.timestamp, BigInt(rules.endTime)),
          // Filter by decodedReferrer not null
          isNotNull(ensIndexerSchema.registrarActions.decodedReferrer),
          // Filter by decodedReferrer not zero address
          ne(ensIndexerSchema.registrarActions.decodedReferrer, zeroAddress),
          // Filter by subregistryId matching the provided subregistryId
          eq(
            ensIndexerSchema.registrarActions.subregistryId,
            stringifyAccountId(rules.subregistryId),
          ),
        ),
      )
      .groupBy(ensIndexerSchema.registrarActions.decodedReferrer)
      .orderBy(desc(sql`total_incremental_duration`));

    // Type assertion: The WHERE clause in the query above guarantees non-null values for:
    // 1. `referrer` is guaranteed to be non-null due to isNotNull filter
    // 2. `totalIncrementalDuration` is guaranteed to be non-null as it is the sum of non-null bigint values
    // 3. `totalRevenueContribution` is guaranteed to be non-null due to COALESCE with 0
    interface NonNullRecord {
      referrer: NormalizedAddress;
      totalReferrals: number;
      totalIncrementalDuration: string;
      totalRevenueContribution: string;
    }

    return (records as NonNullRecord[]).map((record) => {
      return buildReferrerMetrics(
        { chainId: rules.subregistryId.chainId, address: record.referrer },
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

/**
 * Get raw referral events from the database for the sequential race algorithm.
 *
 * Returns individual rows (no GROUP BY) ordered chronologically for deterministic race processing.
 *
 * @param rules - The referral program rules for filtering registrar actions
 * @returns A promise that resolves to an array of {@link ReferralEvent} values.
 * @throws Error if the database query fails.
 */
export const getReferralEvents = async (rules: ReferralProgramRules): Promise<ReferralEvent[]> => {
  try {
    const records = await ensDb
      .select({
        id: ensIndexerSchema.registrarActions.id,
        referrer: ensIndexerSchema.registrarActions.decodedReferrer,
        timestamp: ensIndexerSchema.registrarActions.timestamp,
        incrementalDuration: ensIndexerSchema.registrarActions.incrementalDuration,
        // Note: Using raw SQL for COALESCE because Drizzle doesn't natively support it yet.
        // See: https://github.com/drizzle-team/drizzle-orm/issues/3708
        total: sql<string>`COALESCE(${ensIndexerSchema.registrarActions.total}, 0)`.as("total"),
        // Audit fields (pass-through; the rev-share-cap race carries them on the per-event
        // accounting record so consumers like the CSV endpoint don't need a second query).
        actionType: ensIndexerSchema.registrarActions.type,
        transactionHash: ensIndexerSchema.registrarActions.transactionHash,
        registrant: ensIndexerSchema.registrarActions.registrant,
        // Surface the joined-table primary keys so the post-query null checks can
        // distinguish "lifecycle row missing" from "domain row missing".
        lifecycleNode: ensIndexerSchema.registrationLifecycles.node,
        domainName: ensIndexerSchema.subgraph_domain.name,
      })
      .from(ensIndexerSchema.registrarActions)
      // LEFT JOINs + null-throw post-query: the ENSAnalytics plugin prerequisites
      // (`hasEnsAnalyticsConfigSupport`, enforced by `ensanalyticsApiMiddleware` at request
      // time and `referral-edition-snapshots.cache.ts` at cache-build time) guarantee both
      // joined tables are populated for every active namespace. Under those guarantees the
      // joins behave like INNER joins. We use LEFT joins anyway as a tripwire: if a future
      // indexer change, race condition, or schema migration ever leaves an orphaned row, the
      // null-checks below will throw with the specific `registrarAction.id` instead of
      // silently truncating the leaderboard / accounting.
      .leftJoin(
        ensIndexerSchema.registrationLifecycles,
        eq(ensIndexerSchema.registrarActions.node, ensIndexerSchema.registrationLifecycles.node),
      )
      .leftJoin(
        ensIndexerSchema.subgraph_domain,
        eq(ensIndexerSchema.registrationLifecycles.node, ensIndexerSchema.subgraph_domain.id),
      )
      .where(
        and(
          // Filter by timestamp range
          gte(ensIndexerSchema.registrarActions.timestamp, BigInt(rules.startTime)),
          lte(ensIndexerSchema.registrarActions.timestamp, BigInt(rules.endTime)),
          // Filter by decodedReferrer not null
          isNotNull(ensIndexerSchema.registrarActions.decodedReferrer),
          // Filter by decodedReferrer not zero address
          ne(ensIndexerSchema.registrarActions.decodedReferrer, zeroAddress),
          // Filter by subregistryId matching the provided subregistryId
          eq(
            ensIndexerSchema.registrarActions.subregistryId,
            stringifyAccountId(rules.subregistryId),
          ),
        ),
      )
      .orderBy(asc(ensIndexerSchema.registrarActions.id));

    return records.map((record) => {
      // referrer/timestamp/incrementalDuration are guaranteed non-null by the WHERE clause
      // and NOT NULL schema constraints; total is guaranteed non-null by COALESCE.
      if (record.referrer === null) {
        throw new Error(
          `getReferralEvents: decodedReferrer must be non-null for registrar action '${record.id}'`,
        );
      }
      if (record.lifecycleNode === null) {
        throw new Error(
          `getReferralEvents: no registrationLifecycles row matched registrar action '${record.id}' (this should be unreachable under the ENSAnalytics plugin prerequisites — file a bug)`,
        );
      }
      if (record.domainName === null) {
        throw new Error(
          `getReferralEvents: no subgraph_domain row (or null name) matched registrar action '${record.id}' (this should be unreachable under the ENSAnalytics plugin prerequisites — file a bug)`,
        );
      }
      if (record.transactionHash === null) {
        throw new Error(
          `getReferralEvents: transactionHash must be non-null for registrar action '${record.id}'`,
        );
      }
      if (record.registrant === null) {
        throw new Error(
          `getReferralEvents: registrant must be non-null for registrar action '${record.id}'`,
        );
      }
      switch (record.actionType) {
        case RegistrarActionTypes.Registration:
        case RegistrarActionTypes.Renewal:
          break;
        default: {
          const _exhaustive: never = record.actionType;
          throw new Error(
            `getReferralEvents: unrecognized action type '${String(_exhaustive)}' for registrar action '${record.id}'`,
          );
        }
      }

      return {
        id: record.id,
        referrer: {
          chainId: rules.subregistryId.chainId,
          address: record.referrer as NormalizedAddress,
        },
        timestamp: Number(record.timestamp),
        incrementalDuration: Number(record.incrementalDuration),
        incrementalRevenueContribution: priceEth(BigInt(record.total)),
        name: record.domainName as InterpretedName,
        actionType: record.actionType,
        transactionHash: record.transactionHash as Hash,
        registrant: record.registrant as Address,
      } satisfies ReferralEvent;
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error }, "Failed to fetch referral events from database");
    throw new Error(`Failed to fetch referral events from database: ${errorMessage}`);
  }
};
