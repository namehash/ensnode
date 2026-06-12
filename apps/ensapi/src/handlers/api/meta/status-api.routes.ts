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
  summary: "Get Indexing Status and Stack Info",
  description:
    "Monitor an ENSNode's indexing progress across multiple chains. This endpoint provides a realtime indexing projection at the given moment, and overall stack info about services in the ENSNode instance. The projection includes a cross-chain indexing status snapshot that collects chain status snapshots for each indexed chain. At the moment, the cross-chain indexing status snapshot can be represented as an omnichain indexing status snapshot. Perfect for building monitoring dashboards, health checks, or determining whether your ENSNode has caught up with recent onchain activity.",
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
