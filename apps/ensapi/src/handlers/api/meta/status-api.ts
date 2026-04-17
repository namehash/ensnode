import config from "@/config";

import {
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseError,
  type EnsApiIndexingStatusResponseOk,
  serializeEnsApiIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { createApp } from "@/lib/hono-factory";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";

import { getIndexingStatusRoute } from "./status-api.routes";

const app = createApp({ middlewares: [indexingStatusMiddleware] });

app.openapi(getIndexingStatusRoute, async (c) => {
  if (c.var.indexingStatus instanceof Error) {
    return c.json(
      serializeEnsApiIndexingStatusResponse({
        responseCode: EnsApiIndexingStatusResponseCodes.Error,
      } satisfies EnsApiIndexingStatusResponseError),
      503,
    );
  }

  const ensApiPublicConfig = buildEnsApiPublicConfig(config);

  // return successful response using the indexing status projection from the middleware context
  return c.json(
    serializeEnsApiIndexingStatusResponse({
      responseCode: EnsApiIndexingStatusResponseCodes.Ok,
      realtimeProjection: c.var.indexingStatus,
      ensApiPublicConfig: ensApiPublicConfig,
    } satisfies EnsApiIndexingStatusResponseOk),
    200,
  );
});

export default app;
