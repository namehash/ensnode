import { z } from "zod/v4";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";
import { referrersCacheMiddleware } from "@/middleware/referrers-cache.middleware";

const DEFAULT_PAGINATION_LIMIT = 25;
const MAX_PAGINATION_LIMIT = 100;

const app = factory.createApp();

// Apply referrers cache middleware to all routes in this handler
app.use(referrersCacheMiddleware);

// Pagination query parameters schema
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
});

// Get top referrers with pagination
app.get("/top-referrers", validate("query", paginationQuerySchema), (c) => {
  try {
    const cache = c.var.referrersCache;
    const { page, limit } = c.req.valid("query");

    // Calculate total pages
    const totalPages = Math.ceil(cache.referrers.length / limit);

    // Check if requested page exceeds available pages
    if (page > totalPages && cache.referrers.length > 0) {
      return c.json(
        {
          error: "Page out of range",
          message: `Requested page ${page} exceeds total pages ${totalPages}`,
          totalPages,
        },
        400,
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReferrers = cache.referrers.slice(startIndex, endIndex);

    return c.json({
      referrers: paginatedReferrers,
      total: cache.referrers.length,
      page,
      limit,
      totalPages,
      hasNext: endIndex < cache.referrers.length,
      hasPrev: page > 1,
      updatedAt: cache.updatedAt,
    });
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/top-referrers endpoint");
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
