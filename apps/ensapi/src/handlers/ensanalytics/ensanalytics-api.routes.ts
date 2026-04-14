import { createRoute, z } from "@hono/zod-openapi";
import {
  MAX_EDITIONS_PER_REQUEST,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
} from "@namehash/ens-referrals";
import {
  makeReferralProgramEditionSlugSchema,
  makeReferrerMetricsEditionsArraySchema,
} from "@namehash/ens-referrals/internal";

import { makeNormalizedAddressSchema } from "@ensnode/ensnode-sdk/internal";

export const basePath = "/v1/ensanalytics";

/**
 * Query parameters schema for referrer leaderboard page requests.
 * Validates edition slug, page number, and records per page.
 */
const referrerLeaderboardPageQuerySchema = z.object({
  edition: makeReferralProgramEditionSlugSchema("edition"),
  page: z
    .optional(z.coerce.number().int().min(1, "Page must be a positive integer"))
    .openapi({ type: "integer", minimum: 1 })
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
    .openapi({ type: "integer", minimum: 1, maximum: REFERRERS_PER_LEADERBOARD_PAGE_MAX })
    .describe("Number of referrers per page"),
});

// Referrer address parameter schema
const referrerAddressSchema = z.object({
  referrer: makeNormalizedAddressSchema("Referrer address").describe("Referrer Ethereum address"),
});

// Editions query parameter schema
const editionsQuerySchema = z.object({
  editions: z
    .string()
    .describe("Comma-separated list of edition slugs")
    .transform((value) => value.split(",").map((s) => s.trim()))
    .pipe(makeReferrerMetricsEditionsArraySchema("editions")),
});

export const getReferralLeaderboardRoute = createRoute({
  method: "get",
  path: "/referral-leaderboard",
  operationId: "getReferralLeaderboard",
  tags: ["ENSAwards"],
  summary: "Get Referrer Leaderboard",
  description: "Returns a paginated page from the referrer leaderboard for a specific edition",
  request: {
    query: referrerLeaderboardPageQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved referrer leaderboard page",
    },
    400: {
      description: "Invalid request",
    },
    404: {
      description: "Unknown edition slug",
    },
    500: {
      description: "Internal server error",
    },
    503: {
      description: "Service unavailable",
    },
  },
});

export const getReferrerDetailRoute = createRoute({
  method: "get",
  path: "/referrer/{referrer}",
  operationId: "getReferrerDetail",
  tags: ["ENSAwards"],
  summary: "Get Referrer Detail for Editions",
  description: `Returns detailed information for a specific referrer for the requested editions. Requires 1-${MAX_EDITIONS_PER_REQUEST} distinct edition slugs. All requested editions must be recognized and have cached data, or the request fails.`,
  request: {
    params: referrerAddressSchema,
    query: editionsQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved referrer detail for requested editions",
    },
    400: {
      description: "Invalid request",
    },
    404: {
      description: "Unknown edition slug",
    },
    500: {
      description: "Internal server error",
    },
    503: {
      description: "Service unavailable",
    },
  },
});

export const getEditionsRoute = createRoute({
  method: "get",
  path: "/editions",
  operationId: "getEditions",
  tags: ["ENSAwards"],
  summary: "Get Edition Summaries",
  description:
    "Returns a summary for each configured referral program edition, including its current status and award-model-specific runtime data. Editions are sorted in descending order by start timestamp (most recent first).",
  responses: {
    200: {
      description: "Successfully retrieved edition summaries.",
    },
    500: {
      description: "Internal server error",
    },
    503: {
      description: "Service unavailable",
    },
  },
});

export const routes = [getReferralLeaderboardRoute, getReferrerDetailRoute, getEditionsRoute];
