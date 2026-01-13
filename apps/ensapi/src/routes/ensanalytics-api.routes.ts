import { describeRoute } from "hono-openapi";

export const referrerLeaderboardRoute = describeRoute({
  tags: ["ENSAwards"],
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
});

export const referrerDetailRoute = describeRoute({
  tags: ["ENSAwards"],
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
});
