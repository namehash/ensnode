import { createRoute } from "@hono/zod-openapi";

import {
  makeEnsApiIndexingStatusResponseErrorSchema,
  makeSerializedEnsApiIndexingStatusResponseOkSchema,
} from "@ensnode/ensnode-sdk/internal";

export const basePath = "/api";

export const getIndexingStatusRoute = createRoute({
  method: "get",
  path: "/indexing-status",
  operationId: "getIndexingStatus",
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
