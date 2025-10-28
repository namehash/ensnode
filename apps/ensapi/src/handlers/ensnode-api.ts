import config from "@/config";

import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  serializeENSIndexerPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

import resolutionApi from "./resolution-api";

const app = factory.createApp();

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  return c.json(serializeENSIndexerPublicConfig(config.ensIndexerPublicConfig));
});

// include ENSIndexer Indexing Status endpoint
app.get("/indexing-status", async (c) => {
  // generic error
  if (c.var.indexingStatus.isRejected) {
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }

  return c.json(serializeIndexingStatusResponse(c.var.indexingStatus.value));
});

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
