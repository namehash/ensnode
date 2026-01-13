import { describeRoute } from "hono-openapi";

export const registrarActionsRoute = describeRoute({
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
});

export const registrarActionsByParentNodeRoute = describeRoute({
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
});
