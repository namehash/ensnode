import type { DescribeRouteOptions } from "hono-openapi";
import { resolver as validationResolver } from "hono-openapi";

import {
  makeResolvePrimaryNameResponseSchema,
  makeResolvePrimaryNamesResponseSchema,
  makeResolveRecordsResponseSchema,
} from "@ensnode/ensnode-sdk/internal";

export const getResolveRecordsRoute: DescribeRouteOptions = {
  tags: ["Resolution"],
  summary: "Resolve ENS Records",
  description: "Resolves ENS records for a given name",
  responses: {
    200: {
      description: "Successfully resolved records",
      content: {
        "application/json": {
          schema: validationResolver(makeResolveRecordsResponseSchema()),
        },
      },
    },
  },
};

export const getResolvePrimaryNameRoute: DescribeRouteOptions = {
  tags: ["Resolution"],
  summary: "Resolve Primary Name",
  description: "Resolves a primary name for a given `address` and `chainId`",
  responses: {
    200: {
      description: "Successfully resolved name",
      content: {
        "application/json": {
          schema: validationResolver(makeResolvePrimaryNameResponseSchema()),
        },
      },
    },
  },
};

export const getResolvePrimaryNamesRoute: DescribeRouteOptions = {
  tags: ["Resolution"],
  summary: "Resolve Primary Names",
  description: "Resolves all primary names for a given address across multiple chains",
  responses: {
    200: {
      description: "Successfully resolved records",
      content: {
        "application/json": {
          schema: validationResolver(makeResolvePrimaryNamesResponseSchema()),
        },
      },
    },
  },
};
