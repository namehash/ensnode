import {
  getReferrerLeaderboardPage,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
} from "@namehash/ens-referrals";
import { z } from "zod/v4";

import {
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPaginationRequest,
  serializeReferrerLeaderboardPageResponse,
} from "@ensnode/ensnode-sdk";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referrerLeaderboardCacheMiddleware } from "@/middleware/referrer-leaderboard-cache.middleware";

const app = factory.createApp();
const logger = makeLogger("ensanalytics-api");

// Apply referrer leaderboard cache middleware to all routes in this handler
app.use(referrerLeaderboardCacheMiddleware);

// Pagination query parameters schema (mirrors PaginatedAggregatedReferrersRequest)
const paginationQuerySchema = z.object({
  page: z.optional(z.coerce.number().int().min(1, "Page must be a positive integer")),
  itemsPerPage: z.optional(
    z.coerce
      .number()
      .int()
      .min(1, "Items per page must be at least 1")
      .max(
        REFERRERS_PER_LEADERBOARD_PAGE_MAX,
        `Items per page must not exceed ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}`,
      ),
  ),
}) satisfies z.ZodType<ReferrerLeaderboardPaginationRequest>;

// Get a page from the referrer leaderboard
app.get("/referrers", validate("query", paginationQuerySchema), async (c) => {
  // context must be set by the required middleware
  if (c.var.referrerLeaderboardCache === undefined) {
    throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardCacheMiddleware required`);
  }

  try {
    const referrerLeaderboardCache = c.var.referrerLeaderboardCache;

    if (referrerLeaderboardCache.isRejected) {
      return c.json(
        serializeReferrerLeaderboardPageResponse({
          responseCode: ReferrerLeaderboardPageResponseCodes.Error,
          error: "Internal Server Error",
          errorMessage: "Failed to load referrer leaderboard data.",
        } satisfies ReferrerLeaderboardPageResponse),
        500,
      );
    }

    const { page, itemsPerPage } = c.req.valid("query");
    const leaderboardPage = getReferrerLeaderboardPage(
      { page, itemsPerPage },
      referrerLeaderboardCache.value,
    );

    return c.json(
      serializeReferrerLeaderboardPageResponse({
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: leaderboardPage,
      } satisfies ReferrerLeaderboardPageResponse),
    );
  } catch (error) {
    logger.error({ error }, "Error in /ensanalytics/referrers endpoint");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your request";
    return c.json(
      serializeReferrerLeaderboardPageResponse({
        responseCode: ReferrerLeaderboardPageResponseCodes.Error,
        error: "Internal server error",
        errorMessage,
      } satisfies ReferrerLeaderboardPageResponse),
      500,
    );
  }
});

export default app;
