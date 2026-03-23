import config from "@/config";

import {
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseError,
  type EnsApiIndexingStatusResponseOk,
  serializeENSApiPublicConfig,
  serializeEnsApiIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { createApp } from "@/lib/hono-factory";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";

import { getConfigRoute, getIndexingStatusRoute } from "./status-api.routes";

const app = createApp({ middlewares: [indexingStatusMiddleware] });

app.openapi(getConfigRoute, async (c) => {
  const ensApiPublicConfig = buildEnsApiPublicConfig(config);
  return c.json(serializeENSApiPublicConfig(ensApiPublicConfig));
});

app.openapi(getIndexingStatusRoute, async (c) => {
  if (c.var.indexingStatus instanceof Error) {
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
    } satisfies EnsApiIndexingStatusResponseOk),
    200,
  );
});

export default app;
