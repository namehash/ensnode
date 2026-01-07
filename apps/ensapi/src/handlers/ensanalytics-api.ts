import {
  getReferrerDetail,
  getReferrerLeaderboardPage,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
} from "@namehash/ens-referrals";
import { describeRoute } from "hono-openapi";
import { z } from "zod/v4";

import {
  type ReferrerDetailResponse,
  ReferrerDetailResponseCodes,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  serializeReferrerDetailResponse,
  serializeReferrerLeaderboardPageResponse,
} from "@ensnode/ensnode-sdk";
import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { referrerLeaderboardMiddleware } from "@/middleware/referrer-leaderboard.middleware";

const logger = makeLogger("ensanalytics-api");

// Pagination query parameters schema (mirrors ReferrerLeaderboardPageRequest)
const paginationQuerySchema = z.object({
  page: z
    .optional(z.coerce.number().int().min(1, "Page must be a positive integer"))
    .describe("Page number for pagination"),
  recordsPerPage: z
    .optional(
      z.coerce
        .number()
        .int()
        .min(1, "Records per page must be at least 1")
        .max(
          REFERRERS_PER_LEADERBOARD_PAGE_MAX,
          `Records per page must not exceed ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}`,
        ),
    )
    .describe("Number of referrers per page"),
}) satisfies z.ZodType<ReferrerLeaderboardPageRequest>;

const app = factory
  .createApp()

  // Apply referrer leaderboard cache middleware to all routes in this handler
  .use(referrerLeaderboardMiddleware)

  // Get a page from the referrer leaderboard
  .get(
    "/referrers",
    describeRoute({
      summary: "Get Referrer Leaderboard",
      description: "Returns a paginated page from the referrer leaderboard",
      responses: {
        200: {
          description: "Successfully retrieved referrer leaderboard page",
        },
        500: {
          description: "Internal server error",
        },
      },
    }),
    validate("query", paginationQuerySchema),
    async (c) => {
      // context must be set by the required middleware
      if (c.var.referrerLeaderboard === undefined) {
        throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardMiddleware required`);
      }

      try {
        if (c.var.referrerLeaderboard instanceof Error) {
          return c.json(
            serializeReferrerLeaderboardPageResponse({
              responseCode: ReferrerLeaderboardPageResponseCodes.Error,
              error: "Internal Server Error",
              errorMessage: "Failed to load referrer leaderboard data.",
            } satisfies ReferrerLeaderboardPageResponse),
            500,
          );
        }

        const { page, recordsPerPage } = c.req.valid("query");
        const leaderboardPage = getReferrerLeaderboardPage(
          { page, recordsPerPage },
          c.var.referrerLeaderboard,
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
    },
  );

// Referrer address parameter schema
const referrerAddressSchema = z.object({
  referrer: makeLowercaseAddressSchema("Referrer address").describe("Referrer Ethereum address"),
});

// Get referrer detail for a specific address
app.get(
  "/referrers/:referrer",
  describeRoute({
    summary: "Get Referrer Detail",
    description: "Returns detailed information for a specific referrer by address",
    responses: {
      200: {
        description: "Successfully retrieved referrer detail",
      },
      500: {
        description: "Internal server error",
      },
      503: {
        description: "Service unavailable - referrer leaderboard data not yet cached",
      },
    },
  }),
  validate("param", referrerAddressSchema),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.referrerLeaderboard === undefined) {
      throw new Error(`Invariant(ensanalytics-api): referrerLeaderboardMiddleware required`);
    }

    try {
      // Check if leaderboard failed to load
      if (c.var.referrerLeaderboard instanceof Error) {
        return c.json(
          serializeReferrerDetailResponse({
            responseCode: ReferrerDetailResponseCodes.Error,
            error: "Service Unavailable",
            errorMessage: "Referrer leaderboard data has not been successfully cached yet.",
          } satisfies ReferrerDetailResponse),
          503,
        );
      }

      const { referrer } = c.req.valid("param");
      const detail = getReferrerDetail(referrer, c.var.referrerLeaderboard);

      return c.json(
        serializeReferrerDetailResponse({
          responseCode: ReferrerDetailResponseCodes.Ok,
          data: detail,
        } satisfies ReferrerDetailResponse),
      );
    } catch (error) {
      logger.error({ error }, "Error in /ensanalytics/referrers/:referrer endpoint");
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
  },
);

export default app;
