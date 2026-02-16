import type { DescribeRouteOptions } from "hono-openapi";
import { resolver as validationResolver } from "hono-openapi";

import {
  makeENSApiPublicConfigSchema,
  makeIndexingStatusResponseSchema,
} from "@ensnode/ensnode-sdk/internal";

export const getConfigRoute: DescribeRouteOptions = {
  tags: ["Meta"],
  summary: "Get ENSApi Public Config",
  description: "Gets the public config of the ENSApi instance",
  responses: {
    200: {
      description: "Successfully retrieved ENSApi public config",
      content: {
        "application/json": {
          schema: validationResolver(makeENSApiPublicConfigSchema()),
        },
      },
    },
  },
};

export const getIndexingStatusRoute: DescribeRouteOptions = {
  tags: ["Meta"],
  summary: "Get ENSIndexer Indexing Status",
  description: "Returns the indexing status snapshot most recently captured from ENSIndexer",
  responses: {
    200: {
      description: "Successfully retrieved indexing status",
      content: {
        "application/json": {
          schema: validationResolver(makeIndexingStatusResponseSchema()),
        },
      },
    },
    503: {
      description: "Indexing status snapshot unavailable",
      content: {
        "application/json": {
          schema: validationResolver(makeIndexingStatusResponseSchema()),
        },
      },
    },
  },
};
