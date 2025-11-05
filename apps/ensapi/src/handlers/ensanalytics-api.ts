import { z } from "zod/v4";

import { cacheService } from "@/lib/ensanalytics/cache";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";

const DEFAULT_PAGINATION_LIMIT = 25;
const MAX_PAGINATION_LIMIT = 100;

const app = factory.createApp();

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
    // Check if cache is ready
    if (!cacheService.isCacheReady()) {
      return c.json({ error: "Cache not ready. Service is still initializing." }, 500);
    }

    // Get validated query parameters
    const { page, limit } = c.req.valid("query");

    // Get paginated results from cache
    const result = cacheService.getTopReferrers(page, limit);

    return c.json({
      referrers: result.referrers,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/top-referrers endpoint");
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
