import { createRoute } from "@hono/zod-openapi";

import {
  makeEnsApiIndexingStatusResponseErrorSchema,
  makeSerializedEnsApiIndexingStatusResponseOkSchema,
  makeSerializedEnsApiPublicConfigSchema,
} from "@ensnode/ensnode-sdk/internal";

export const basePath = "/api";

export const getConfigRoute = createRoute({
  method: "get",
  path: "/config",
  tags: ["Meta"],
  summary: "Get ENSApi Public Config",
  description: "Gets the public config of the ENSApi instance",
  responses: {
    200: {
      description: "Successfully retrieved ENSApi public config",
      content: {
        "application/json": {
          schema: makeSerializedEnsApiPublicConfigSchema(),
        },
      },
    },
  },
});

export const getIndexingStatusRoute = createRoute({
  method: "get",
  path: "/indexing-status",
  tags: ["Meta"],
  summary: "Get ENSIndexer Indexing Status",
  description: "Returns the indexing status snapshot most recently captured from ENSIndexer",
  responses: {
    200: {
      description: "Successfully retrieved indexing status",
      content: {
        "application/json": {
          schema: makeSerializedEnsApiIndexingStatusResponseOkSchema(),
        },
      },
    },
    503: {
      description: "Indexing status snapshot unavailable",
      content: {
        "application/json": {
          schema: makeEnsApiIndexingStatusResponseErrorSchema(),
        },
      },
    },
  },
});

export const routes = [getConfigRoute, getIndexingStatusRoute];
