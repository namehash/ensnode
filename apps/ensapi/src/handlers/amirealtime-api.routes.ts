import type { DescribeRouteOptions } from "hono-openapi";

export const getAmIRealtimeRoute = {
  tags: ["Meta"],
  summary: "Check indexing progress",
  description:
    "Checks if the indexing progress is guaranteed to be within a requested worst-case distance of realtime",
  responses: {
    200: {
      description:
        "Indexing progress is guaranteed to be within the requested distance of realtime",
    },
    503: {
      description:
        "Indexing progress is not guaranteed to be within the requested distance of realtime or indexing status unavailable",
    },
  },
} satisfies DescribeRouteOptions;
