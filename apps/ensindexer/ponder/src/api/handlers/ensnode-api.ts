import config from "@/config";

import { getUnixTime } from "date-fns";
import { Hono } from "hono";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  serializeENSIndexerPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildENSIndexerPublicConfig } from "@/config/public";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";

const app = new Hono();

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  // prepare the public config object, including dependency info
  const publicConfig = await buildENSIndexerPublicConfig(config);

  // respond with the serialized public config object
  return c.json(serializeENSIndexerPublicConfig(publicConfig));
});

app.get("/indexing-status", async (c) => {
  // get system timestamp for the current request
  const snapshotTime = getUnixTime(new Date());

  try {
    const omnichainSnapshot = await indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();

    const crossChainSnapshot = buildCrossChainIndexingStatusSnapshotOmnichain(
      omnichainSnapshot,
      snapshotTime,
    );

    const projectedAt = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(
      crossChainSnapshot,
      projectedAt,
    );

    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection,
      } satisfies IndexingStatusResponseOk),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Omnichain snapshot is currently not available: ${errorMessage}`);

    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }
});

export default app;
