import { MAX_EDITIONS_PER_REQUEST } from "@namehash/ens-referrals/v1";
import type { DescribeRouteOptions } from "hono-openapi";

export const getReferralLeaderboardV1Route = {
  tags: ["ENSAwards"],
  summary: "Get Referrer Leaderboard (v1)",
  description: "Returns a paginated page from the referrer leaderboard for a specific edition",
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
} satisfies DescribeRouteOptions;

export const getReferrerDetailV1Route = {
  tags: ["ENSAwards"],
  summary: "Get Referrer Detail for Editions (v1)",
  description: `Returns detailed information for a specific referrer for the requested editions. Requires 1-${MAX_EDITIONS_PER_REQUEST} distinct edition slugs. All requested editions must be recognized and have cached data, or the request fails.`,
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
} satisfies DescribeRouteOptions;

export const getEditionConfigSetRoute = {
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
} satisfies DescribeRouteOptions;
