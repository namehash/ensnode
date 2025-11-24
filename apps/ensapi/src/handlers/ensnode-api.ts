import config from "@/config";

import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
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
  const cachedIndexingStatus = c.var.indexingStatus;

  // return error response if indexing status has never been cached successfully
  if (cachedIndexingStatus.isRejected) {
    logger.error(
      {
        error: cachedIndexingStatus.reason,
      },
      "Failed to load Indexing Status from cache.",
    );

    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }

  return c.json(serializeIndexingStatusResponse(cachedIndexingStatus.value));
});

// Registrar Actions API
app.route("/registrar-actions", registrarActionsApi);

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
