import { z } from "zod/v4";

import {
  type AggregatedReferrerMetrics,
  type AggregatedReferrerMetricsContribution,
  ITEMS_PER_PAGE_DEFAULT,
  ITEMS_PER_PAGE_MAX,
  type PaginatedAggregatedReferrersRequest,
  type PaginatedAggregatedReferrersResponse,
  PaginatedAggregatedReferrersResponseCodes,
  serializePaginatedAggregatedReferrersResponse,
} from "@ensnode/ensnode-sdk";

import { errorResponse } from "@/lib/handlers/error-response";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { islice } from "@/lib/itertools";
import { makeLogger } from "@/lib/logger";
import { aggregatedReferrerSnapshotCacheMiddleware } from "@/middleware/aggregated-referrer-snapshot-cache.middleware";

const app = factory.createApp();
const logger = makeLogger("ensanalytics-api");

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
 * @param grandTotalQualifiedIncrementalDuration - The sum of all incremental duration across all referrers
 * @returns The referrer metrics with contribution percentages
 */
function calculateContribution(
  referrer: AggregatedReferrerMetrics,
  grandTotalQualifiedIncrementalDuration: number,
): AggregatedReferrerMetricsContribution {
  return {
    ...referrer,
    qualifiedReferrerContribution: referrer.isTopReferrer
      ? referrer.totalIncrementalDuration / grandTotalQualifiedIncrementalDuration
      : 0
  };
}

// Get all aggregated referrers with pagination
app.get("/aggregated-referrers", validate("query", paginationQuerySchema), async (c) => {
  // context must be set by the required middleware
  if (c.var.aggregatedReferrerSnapshotCache === undefined) {
    throw new Error(
      `Invariant(ensanalytics-api): aggregatedReferrerSnapshotCacheMiddleware required`,
    );
  }

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
        aggregatedReferrerSnapshotCache.grandTotalQualifiedIncrementalDuration,
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

export default app;
