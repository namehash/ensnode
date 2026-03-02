import config from "@/config";

import { getUnixTime } from "date-fns";
import { Hono } from "hono";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  EnsIndexerIndexingStatusResponseCodes,
  type EnsIndexerIndexingStatusResponseError,
  type EnsIndexerIndexingStatusResponseOk,
  serializeEnsIndexerIndexingStatusResponse,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { buildENSIndexerPublicConfig } from "@/config/public";
import { IndexingStatusBuilder } from "@/lib/indexing-status-builder";
import { localPonderClient } from "@/lib/local-ponder-client";

const app = new Hono();
const indexingStatusBuilder = new IndexingStatusBuilder(localPonderClient);

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  // prepare the public config object, including dependency info
  const publicConfig = await buildENSIndexerPublicConfig(config);

  // respond with the serialized public config object
  return c.json(serializeEnsIndexerPublicConfig(publicConfig));
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
      serializeEnsIndexerIndexingStatusResponse({
        responseCode: EnsIndexerIndexingStatusResponseCodes.Ok,
        realtimeProjection,
      } satisfies EnsIndexerIndexingStatusResponseOk),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Omnichain snapshot is currently not available: ${errorMessage}`);

    return c.json(
      serializeEnsIndexerIndexingStatusResponse({
        responseCode: EnsIndexerIndexingStatusResponseCodes.Error,
      } satisfies EnsIndexerIndexingStatusResponseError),
      500,
    );
  }
});

export default app;
