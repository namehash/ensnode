import {
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseError,
  type EnsApiIndexingStatusResponseOk,
  serializeEnsApiIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { createApp } from "@/lib/hono-factory";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
import { stackInfoMiddleware } from "@/middleware/stack-info.middleware";

import { getIndexingStatusRoute } from "./status-api.routes";

const app = createApp({ middlewares: [stackInfoMiddleware, indexingStatusMiddleware] });

app.openapi(getIndexingStatusRoute, async (c) => {
  if (c.var.indexingStatus instanceof Error || c.var.stackInfo instanceof Error) {
    return c.json(
      serializeEnsApiIndexingStatusResponse({
        responseCode: EnsApiIndexingStatusResponseCodes.Error,
      } satisfies EnsApiIndexingStatusResponseError),
      503,
    );
  }

  // return successful response using the indexing status projection from the middleware context
  return c.json(
    serializeEnsApiIndexingStatusResponse({
      responseCode: EnsApiIndexingStatusResponseCodes.Ok,
      realtimeProjection: c.var.indexingStatus,
      stackInfo: c.var.stackInfo,
    } satisfies EnsApiIndexingStatusResponseOk),
    200,
  );
});

export default app;
