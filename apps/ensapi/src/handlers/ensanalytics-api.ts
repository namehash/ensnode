import { cacheService } from "@/lib/ensanalytics/cache";
import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";

const DEFAULT_PAGINATION_LIMIT = 25;
const MAX_PAGINATION_LIMIT = 100;

const app = factory.createApp();

// Health check endpoint for ENSAnalytics cache status
app.get("/health", (c) => {
  const stats = cacheService.getCacheStats();
  return c.json({
    status: cacheService.isCacheReady() ? "healthy" : "unhealthy",
    cache: stats,
  });
});

// Get top referrers with pagination
app.get("/top-referrers", (c) => {
  try {
    // Check if cache is ready
    if (!cacheService.isCacheReady()) {
      return c.json({ error: "Cache not ready. Service is still initializing." }, 500);
    }

    // Parse and validate query parameters
    const pageParam = c.req.query("page");
    const limitParam = c.req.query("limit");

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_PAGINATION_LIMIT;

    // Validate pagination parameters
    if (Number.isNaN(page) || page < 1) {
      return c.json({ error: "Page must be a positive integer" }, 400);
    }

    if (Number.isNaN(limit) || limit < 1 || limit > MAX_PAGINATION_LIMIT) {
      return c.json({ error: `Limit must be between 1 and ${MAX_PAGINATION_LIMIT}` }, 400);
    }

    // Get paginated results from cache
    const result = cacheService.getTopReferrers(page, limit);

    return c.json({
      referrers: result.referrers,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    });
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/top-referrers endpoint");
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
