import { z } from "zod/v4";

import {
  type PaginatedTopReferrersRequest,
  type PaginatedTopReferrersResponse,
  PaginatedTopReferrersResponseCodes,
} from "@ensnode/ensnode-sdk";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";
import { topReferrersCacheMiddleware } from "@/middleware/top-referrers-cache.middleware";

const DEFAULT_PAGINATION_LIMIT = 25;
const MAX_PAGINATION_LIMIT = 100;

const app = factory.createApp();

// Apply referrers cache middleware to all routes in this handler
app.use(topReferrersCacheMiddleware);

// Pagination query parameters schema (mirrors PaginatedTopReferrersRequest)
const paginationQuerySchema = z.object({
  page: z.optional(z.coerce.number().int().min(1, "Page must be a positive integer")).default(1),
  limit: z
    .optional(
      z.coerce
        .number()
        .int()
        .min(1, "Limit must be at least 1")
        .max(MAX_PAGINATION_LIMIT, `Limit must not exceed ${MAX_PAGINATION_LIMIT}`),
    )
    .default(DEFAULT_PAGINATION_LIMIT),
}) satisfies z.ZodType<Required<PaginatedTopReferrersRequest>>;

// Get top referrers with pagination
app.get("/top-referrers", validate("query", paginationQuerySchema), async (c) => {
  try {
    const topReferrersCache = c.var.topReferrersCache;
    const { page, limit } = c.req.valid("query");

    // Calculate total pages
    const totalPages = Math.ceil(topReferrersCache.topReferrers.length / limit);

    // Check if requested page exceeds available pages
    if (page > totalPages && topReferrersCache.topReferrers.length > 0) {
      return c.json(
        {
          responseCode: PaginatedTopReferrersResponseCodes.PageOutOfRange,
          error: "Page out of range",
          errorMessage: `Requested page ${page} exceeds total pages ${totalPages}`,
          totalPages,
        } satisfies PaginatedTopReferrersResponse,
        400,
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReferrers = topReferrersCache.topReferrers.slice(startIndex, endIndex);

    return c.json({
      responseCode: PaginatedTopReferrersResponseCodes.Ok,
      data: {
        topReferrers: paginatedReferrers,
        total: topReferrersCache.topReferrers.length,
        page,
        limit,
        hasNext: endIndex < topReferrersCache.topReferrers.length,
        hasPrev: page > 1,
        updatedAt: topReferrersCache.updatedAt,
      },
    } satisfies PaginatedTopReferrersResponse);
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/top-referrers endpoint");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your request";
    return c.json(
      {
        responseCode: PaginatedTopReferrersResponseCodes.Error,
        error: "Internal server error",
        errorMessage,
      } satisfies PaginatedTopReferrersResponse,
      500,
    );
  }
});

export default app;
