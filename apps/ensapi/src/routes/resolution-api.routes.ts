import { describeRoute, resolver as validationResolver } from "hono-openapi";

import {
  makeResolvePrimaryNameResponseSchema,
  makeResolvePrimaryNamesResponseSchema,
  makeResolveRecordsResponseSchema,
} from "@ensnode/ensnode-sdk/internal";

export const resolveRecordsRoute = describeRoute({
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
});

export const resolvePrimaryNameRoute = describeRoute({
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
});

export const resolvePrimaryNamesRoute = describeRoute({
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
});
