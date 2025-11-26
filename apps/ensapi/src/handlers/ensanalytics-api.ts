import { z } from "zod/v4";

import {
  type AggregatedReferrerMetrics,
  type AggregatedReferrerMetricsContribution,
  ENS_HOLIDAY_AWARDS_POOL_USD,
  ITEMS_PER_PAGE_DEFAULT,
  ITEMS_PER_PAGE_MAX,
  type PaginatedAggregatedReferrersRequest,
  type PaginatedAggregatedReferrersResponse,
  PaginatedAggregatedReferrersResponseCodes,
  priceUsdc,
  type ReferrerDetailResponse,
  ReferrerDetailResponseCodes,
  SECONDS_PER_YEAR,
  serializePaginatedAggregatedReferrersResponse,
  serializeReferrerDetailResponse,
} from "@ensnode/ensnode-sdk";
import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import { errorResponse } from "@/lib/handlers/error-response";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { islice } from "@/lib/itertools";
import logger from "@/lib/logger";
import { aggregatedReferrerSnapshotCacheMiddleware } from "@/middleware/aggregated-referrer-snapshot-cache.middleware";

const app = factory.createApp();

// Apply aggregated referrer snapshot cache middleware to all routes in this handler
app.use(aggregatedReferrerSnapshotCacheMiddleware);

// Pagination query parameters schema (mirrors PaginatedAggregatedReferrersRequest)
const paginationQuerySchema = z.object({
  page: z.optional(z.coerce.number().int().min(1, "Page must be a positive integer")).default(1),
  itemsPerPage: z
    .optional(
      z.coerce
        .number()
        .int()
        .min(1, "Items per page must be at least 1")
        .max(ITEMS_PER_PAGE_MAX, `Items per page must not exceed ${ITEMS_PER_PAGE_MAX}`),
    )
    .default(ITEMS_PER_PAGE_DEFAULT),
}) satisfies z.ZodType<Required<PaginatedAggregatedReferrersRequest>>;

/**
 * Converts an AggregatedReferrerMetrics object to AggregatedReferrerMetricsContribution
 * by calculating contribution percentages based on grand totals.
 *
 * @param referrer - The referrer metrics to convert
 * @param grandTotalReferrals - The sum of all referrals across all referrers
 * @param grandTotalIncrementalDuration - The sum of all incremental duration across all referrers
 * @returns The referrer metrics with contribution percentages
 */
function calculateContribution(
  referrer: AggregatedReferrerMetrics,
  grandTotalReferrals: number,
  grandTotalIncrementalDuration: number,
): AggregatedReferrerMetricsContribution {
  return {
    ...referrer,
    totalReferralsContribution:
      grandTotalReferrals > 0 ? referrer.totalReferrals / grandTotalReferrals : 0,
    totalIncrementalDurationContribution:
      grandTotalIncrementalDuration > 0
        ? referrer.totalIncrementalDuration / grandTotalIncrementalDuration
        : 0,
  };
}

// Get all aggregated referrers with pagination
app.get("/aggregated-referrers", validate("query", paginationQuerySchema), async (c) => {
  try {
    const aggregatedReferrerSnapshotCache = c.var.aggregatedReferrerSnapshotCache;

    // Check if cache failed to load
    if (aggregatedReferrerSnapshotCache === null) {
      return c.json(
        serializePaginatedAggregatedReferrersResponse({
          responseCode: PaginatedAggregatedReferrersResponseCodes.Error,
          error: "Internal Server Error",
          errorMessage: "Failed to load aggregated referrer data.",
        } satisfies PaginatedAggregatedReferrersResponse),
        500,
      );
    }

    const { page, itemsPerPage } = c.req.valid("query");

    const totalAggregatedReferrers = aggregatedReferrerSnapshotCache.referrers.size;

    // Calculate total pages
    const totalPages = Math.ceil(totalAggregatedReferrers / itemsPerPage);

    // Check if requested page exceeds available pages
    if (totalAggregatedReferrers > 0) {
      const pageValidationSchema = z
        .number()
        .max(totalPages, `Page ${page} exceeds total pages ${totalPages}`);

      const pageValidation = pageValidationSchema.safeParse(page);
      if (!pageValidation.success) {
        return errorResponse(c, pageValidation.error);
      }
    }

    // Use iterator slice to extract paginated results
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReferrers = islice(
      aggregatedReferrerSnapshotCache.referrers.values(),
      startIndex,
      endIndex,
    );

    // Convert AggregatedReferrerMetrics to AggregatedReferrerMetricsContribution
    const referrersWithContribution = Array.from(paginatedReferrers).map((referrer) =>
      calculateContribution(
        referrer,
        aggregatedReferrerSnapshotCache.grandTotalReferrals,
        aggregatedReferrerSnapshotCache.grandTotalIncrementalDuration,
      ),
    );

    return c.json(
      serializePaginatedAggregatedReferrersResponse({
        responseCode: PaginatedAggregatedReferrersResponseCodes.Ok,
        data: {
          referrers: referrersWithContribution,
          total: totalAggregatedReferrers,
          paginationParams: {
            page,
            itemsPerPage,
          },
          hasNext: endIndex < totalAggregatedReferrers,
          hasPrev: page > 1,
          updatedAt: aggregatedReferrerSnapshotCache.updatedAt,
        },
      } satisfies PaginatedAggregatedReferrersResponse),
    );
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/aggregated-referrers endpoint");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your request";
    return c.json(
      serializePaginatedAggregatedReferrersResponse({
        responseCode: PaginatedAggregatedReferrersResponseCodes.Error,
        error: "Internal server error",
        errorMessage,
      } satisfies PaginatedAggregatedReferrersResponse),
      500,
    );
  }
});

// Referrer address parameter schema
const referrerAddressSchema = z.object({
  referrer: makeLowercaseAddressSchema("Referrer address"),
});

// Get referrer detail for a specific address
app.get("/referrer/:referrer", validate("param", referrerAddressSchema), async (c) => {
  try {
    const aggregatedReferrerSnapshotCache = c.var.aggregatedReferrerSnapshotCache;

    // Check if cache failed to load
    if (aggregatedReferrerSnapshotCache === null) {
      return c.json(
        serializeReferrerDetailResponse({
          responseCode: ReferrerDetailResponseCodes.Error,
          error: "Internal Server Error",
          errorMessage: "Failed to load aggregated referrer data.",
        } satisfies ReferrerDetailResponse),
        500,
      );
    }

    const { referrer } = c.req.valid("param");

    // Lookup the referrer in the cache
    const referrerMetrics = aggregatedReferrerSnapshotCache.referrers.get(referrer);

    // If referrer not found, return 404 Not Found
    if (!referrerMetrics) {
      return c.notFound();
    }

    // Calculate referrer score (in Qualifying Referral Years)
    const referrerScore = referrerMetrics.totalIncrementalDuration / SECONDS_PER_YEAR;

    // Grand total referrer score (in Qualifying Referral Years) is the sum of all incremental durations converted to years
    const grandTotalReferrerScore =
      aggregatedReferrerSnapshotCache.grandTotalIncrementalDuration / SECONDS_PER_YEAR;

    // Calculate referrer contribution (as a percentage from 0 to 1)
    const referrerContribution =
      grandTotalReferrerScore > 0 ? referrerScore / grandTotalReferrerScore : 0;

    // Calculate award pool share (ENS Holiday Awards Pool in USDC)
    // USDC has 6 decimals
    const USDC_DECIMALS = 6;
    const awardPoolTotalAmount = BigInt(ENS_HOLIDAY_AWARDS_POOL_USD) * BigInt(10 ** USDC_DECIMALS);
    // Calculate share using the already-computed contribution percentage
    // Scale contribution (0-1) by 1e18 to convert to fixed-point for BigInt math
    const PRECISION_SCALE = 1e18;
    const awardPoolShareAmount =
      referrerContribution > 0
        ? (awardPoolTotalAmount * BigInt(Math.floor(referrerContribution * PRECISION_SCALE))) /
          BigInt(PRECISION_SCALE)
        : 0n;

    return c.json(
      serializeReferrerDetailResponse({
        responseCode: ReferrerDetailResponseCodes.Ok,
        data: {
          referrer: referrerMetrics.referrer,
          totalReferrals: referrerMetrics.totalReferrals,
          totalIncrementalDuration: referrerMetrics.totalIncrementalDuration,
          referrerScore,
          grandTotalReferrerScore,
          referrerContribution,
          awardPoolShare: priceUsdc(awardPoolShareAmount),
          updatedAt: aggregatedReferrerSnapshotCache.updatedAt,
        },
      } satisfies ReferrerDetailResponse),
    );
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/referrer/:referrer endpoint");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your request";
    return c.json(
      serializeReferrerDetailResponse({
        responseCode: ReferrerDetailResponseCodes.Error,
        error: "Internal server error",
        errorMessage,
      } satisfies ReferrerDetailResponse),
      500,
    );
  }
});

export default app;
