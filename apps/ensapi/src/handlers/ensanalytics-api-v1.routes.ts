import { createRoute } from "@hono/zod-openapi";
import {
  MAX_EDITIONS_PER_REQUEST,
  REFERRERS_PER_LEADERBOARD_PAGE_MAX,
} from "@namehash/ens-referrals/v1";
import {
  makeReferralProgramEditionSlugSchema,
  makeReferrerMetricsEditionsArraySchema,
} from "@namehash/ens-referrals/v1/internal";
import { z } from "zod/v4";

import { makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

export const basePath = "/v1/ensanalytics";

/**
 * Query parameters schema for referrer leaderboard page requests.
 * Validates edition slug, page number, and records per page.
 */
const referrerLeaderboardPageQuerySchema = z.object({
  edition: makeReferralProgramEditionSlugSchema("edition"),
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
const referrerAddressSchema = z.object({
  referrer: makeLowercaseAddressSchema("Referrer address").describe("Referrer Ethereum address"),
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
  operationId: "getV1EnsanalyticsReferralLeaderboard",
  tags: ["ENSAwards"],
  summary: "Get Referrer Leaderboard (v1)",
  description: "Returns a paginated page from the referrer leaderboard for a specific edition",
  request: {
    query: referrerLeaderboardPageQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved referrer leaderboard page",
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
  operationId: "getV1EnsanalyticsReferrerDetail",
  tags: ["ENSAwards"],
  summary: "Get Referrer Detail for Editions (v1)",
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
  operationId: "getV1EnsanalyticsEditions",
  tags: ["ENSAwards"],
  summary: "Get Edition Config Set (v1)",
  description:
    "Returns the currently configured referral program edition config set. Editions are sorted in descending order by start timestamp (most recent first).",
  responses: {
    200: {
      description: "Successfully retrieved edition config set",
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
