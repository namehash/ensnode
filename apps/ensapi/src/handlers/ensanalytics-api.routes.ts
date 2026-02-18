import { createRoute } from "@hono/zod-openapi";
import { REFERRERS_PER_LEADERBOARD_PAGE_MAX } from "@namehash/ens-referrals";
import { z } from "zod/v4";

import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

export const basePath = "/ensanalytics";

// Pagination query parameters schema (mirrors ReferrerLeaderboardPageRequest)
export const paginationQuerySchema = z.object({
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
});

// Referrer address parameter schema
export const referrerAddressSchema = z.object({
  referrer: makeLowercaseAddressSchema("Referrer address").describe("Referrer Ethereum address"),
});

export const getReferrerLeaderboardRoute = createRoute({
  method: "get",
  path: "/referrers",
  tags: ["ENSAwards"],
  summary: "Get Referrer Leaderboard",
  description: "Returns a paginated page from the referrer leaderboard",
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved referrer leaderboard page",
    },
    500: {
      description: "Internal server error",
    },
  },
});

export const getReferrerDetailRoute = createRoute({
  method: "get",
  path: "/referrers/:referrer",
  tags: ["ENSAwards"],
  summary: "Get Referrer Detail",
  description: "Returns detailed information for a specific referrer by address",
  request: {
    params: referrerAddressSchema,
  },
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
});

export const routes = [getReferrerLeaderboardRoute, getReferrerDetailRoute];
