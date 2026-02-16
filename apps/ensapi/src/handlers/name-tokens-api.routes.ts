import type { DescribeRouteOptions } from "hono-openapi";
import { resolver as validationResolver } from "hono-openapi";

import { ErrorResponseSchema, makeNameTokensResponseSchema } from "@ensnode/ensnode-sdk/internal";

export const getNameTokensRoute: DescribeRouteOptions = {
  tags: ["Explore"],
  summary: "Get Name Tokens",
  description: "Returns name tokens for the requested identifier (domainId or name)",
  responses: {
    200: {
      description: "Name tokens known",
      content: {
        "application/json": {
          schema: validationResolver(makeNameTokensResponseSchema("Name Tokens Response", true)),
        },
      },
    },
    400: {
      description: "Invalid input",
      content: {
        "application/json": {
          schema: validationResolver(ErrorResponseSchema),
        },
      },
    },
    404: {
      description: "Name tokens not indexed",
      content: {
        "application/json": {
          schema: validationResolver(makeNameTokensResponseSchema("Name Tokens Response", true)),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: validationResolver(ErrorResponseSchema),
        },
      },
    },
    503: {
      description:
        "Service unavailable - Name Tokens API prerequisites not met (indexing status not ready or required plugins not activated)",
      content: {
        "application/json": {
          schema: validationResolver(makeNameTokensResponseSchema("Name Tokens Response", true)),
        },
      },
    },
  },
};
