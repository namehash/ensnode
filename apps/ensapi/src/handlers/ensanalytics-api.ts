import {
  buildZeroScoreReferrerMetrics,
  getReferrerLeaderboardPage,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
} from "@namehash/ens-referrals";
import { z } from "zod/v4";

import {
  type ReferrerDetailResponse,
  ReferrerDetailResponseCodes,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPaginationRequest,
  serializeReferrerDetailResponse,
  serializeReferrerLeaderboardPageResponse,
} from "@ensnode/ensnode-sdk";
import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referrerLeaderboardMiddleware } from "@/middleware/referrer-leaderboard.middleware";

const logger = makeLogger("ensanalytics-api");

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

const app = factory
  .createApp()

  // Apply referrer leaderboard cache middleware to all routes in this handler
  .use(referrerLeaderboardMiddleware)

  // Get a page from the referrer leaderboard
  .get("/referrers", validate("query", paginationQuerySchema), async (c) => {
    // context must be set by the required middleware
    if (c.var.referrerLeaderboard === undefined) {
      throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardMiddleware required`);
    }

    try {
      const referrerLeaderboard = c.var.referrerLeaderboard;

      if (referrerLeaderboard.isRejected) {
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
        referrerLeaderboard.value,
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

// Referrer address parameter schema
const referrerAddressSchema = z.object({
  referrer: makeLowercaseAddressSchema("Referrer address"),
});

// Get referrer detail for a specific address
app.get("/referrer/:referrer", validate("param", referrerAddressSchema), async (c) => {
  // context must be set by the required middleware
  if (c.var.referrerLeaderboard === undefined) {
    throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardMiddleware required`);
  }

  try {
    const referrerLeaderboard = c.var.referrerLeaderboard;

    // Check if leaderboard failed to load
    if (referrerLeaderboard.isRejected) {
      return c.json(
        serializeReferrerDetailResponse({
          responseCode: ReferrerDetailResponseCodes.Error,
          error: "Internal Server Error",
          errorMessage: "Failed to load referrer leaderboard data.",
        } satisfies ReferrerDetailResponse),
        500,
      );
    }

    const { referrer } = c.req.valid("param");

    const leaderboard = referrerLeaderboard.value;

    // Lookup the referrer in the leaderboard
    let awardedReferrerMetrics = leaderboard.referrers.get(referrer);

    // If referrer not found, create a zero-score referrer record
    if (!awardedReferrerMetrics) {
      // Rank is leaderboard size + 1 (last position)
      const rank = leaderboard.referrers.size + 1;
      awardedReferrerMetrics = buildZeroScoreReferrerMetrics(
        referrer,
        rank,
        leaderboard.aggregatedMetrics,
        leaderboard.rules,
      );
    }

    return c.json(
      serializeReferrerDetailResponse({
        responseCode: ReferrerDetailResponseCodes.Ok,
        data: {
          referrer: awardedReferrerMetrics,
          accurateAsOf: leaderboard.accurateAsOf,
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
