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
import { makeLogger } from "@/lib/logger";

import registrarActionsApi from "./registrar-actions-api";
import resolutionApi from "./resolution-api";

const app = factory.createApp();

const logger = makeLogger("ensnode");

// include ENSApi Public Config endpoint
app.get("/config", async (c) => {
  const ensApiPublicConfig = buildEnsApiPublicConfig(config);
  return c.json(serializeENSApiPublicConfig(ensApiPublicConfig));
});

// include ENSIndexer Indexing Status endpoint
app.get("/indexing-status", async (c) => {
  const indexingStatusContext = c.var.indexingStatus;

  if (indexingStatusContext.isRejected) {
    // no indexing status available in context
    logger.error(
      {
        error: indexingStatusContext.reason,
      },
      "Indexing status requested but is not available in context.",
    );

    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }

  // return successful response using the indexing status projection from the context
  return c.json(
    serializeIndexingStatusResponse({
      responseCode: IndexingStatusResponseCodes.Ok,
      realtimeProjection: indexingStatusContext.value,
    } satisfies IndexingStatusResponseOk),
  );
});

// Registrar Actions API
app.route("/registrar-actions", registrarActionsApi);

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
