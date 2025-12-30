import config from "@/config";

import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  serializeENSApiPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { factory } from "@/lib/hono-factory";

import nameTokensApi from "./name-tokens-api";
import registrarActionsApi from "./registrar-actions-api";
import resolutionApi from "./resolution-api";

const app = factory.createApp();

// include ENSApi Public Config endpoint
app.get("/config", async (c) => {
  const ensApiPublicConfig = buildEnsApiPublicConfig(config);
  return c.json(serializeENSApiPublicConfig(ensApiPublicConfig));
});

// include ENSIndexer Indexing Status endpoint
app.get("/indexing-status", async (c) => {
  // context must be set by the required middleware
  if (c.var.indexingStatus === undefined) {
    throw new Error(`Invariant(ensnode-api): indexingStatusMiddleware required`);
  }

  if (c.var.indexingStatus instanceof Error) {
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      503,
    );
  }

  // return successful response using the indexing status projection from the context
  return c.json(
    serializeIndexingStatusResponse({
      responseCode: IndexingStatusResponseCodes.Ok,
      realtimeProjection: c.var.indexingStatus,
    } satisfies IndexingStatusResponseOk),
  );
});

// Name Tokens API
app.route("/name-tokens", nameTokensApi);

// Registrar Actions API
app.route("/registrar-actions", registrarActionsApi);

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
