import type { DescribeRouteOptions } from "hono-openapi";

export const getRegistrarActionsRoute = {
  tags: ["Explore"],
  summary: "Get Registrar Actions",
  description: "Returns all registrar actions with optional filtering and pagination",
  responses: {
    200: {
      description: "Successfully retrieved registrar actions",
    },
    400: {
      description: "Invalid query",
    },
    500: {
      description: "Internal server error",
    },
  },
} satisfies DescribeRouteOptions;

export const getRegistrarActionsByParentNodeRoute = {
  tags: ["Explore"],
  summary: "Get Registrar Actions by Parent Node",
  description:
    "Returns registrar actions filtered by parent node hash with optional additional filtering and pagination",
  responses: {
    200: {
      description: "Successfully retrieved registrar actions",
    },
    400: {
      description: "Invalid input",
    },
    500: {
      description: "Internal server error",
    },
  },
} satisfies DescribeRouteOptions;
