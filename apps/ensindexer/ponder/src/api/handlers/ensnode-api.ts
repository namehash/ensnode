import config from "@/config";

import { getUnixTime } from "date-fns";
import { Hono } from "hono";

import {
  createRealtimeIndexingStatusProjection,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  type OmnichainIndexingStatusSnapshot,
  serializeENSIndexerPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildENSIndexerPublicConfig } from "@/config/public";
import { createCrossChainIndexingStatusSnapshotOmnichain } from "@/lib/indexing-status/build-index-status";
import { buildOmnichainIndexingStatusSnapshot } from "@/lib/indexing-status-builder/omnichain-indexing-status-snapshot";
import {
  cachedChainsBlockRefs,
  indexedChainIds,
  ponderClient,
} from "@/ponder/api/lib/local-ponder-client";

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

  let omnichainSnapshot: OmnichainIndexingStatusSnapshot | undefined;

  try {
    const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
      ponderClient.metrics(),
      ponderClient.status(),
    ]);

    omnichainSnapshot = buildOmnichainIndexingStatusSnapshot(
      indexedChainIds,
      cachedChainsBlockRefs,
      ponderIndexingMetrics,
      ponderIndexingStatus,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Indexing Status is currently not available. Failed to fetch Omnichain Indexing Status snapshot: ${errorMessage}`,
    );
  }

  // return IndexingStatusResponseError
  if (!omnichainSnapshot) {
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }
  const crossChainSnapshot = createCrossChainIndexingStatusSnapshotOmnichain(
    omnichainSnapshot,
    snapshotTime,
  );

  const projectedAt = getUnixTime(new Date());
  const realtimeProjection = createRealtimeIndexingStatusProjection(
    crossChainSnapshot,
    projectedAt,
  );

  // return the serialized indexing status response object
  return c.json(
    serializeIndexingStatusResponse({
      responseCode: IndexingStatusResponseCodes.Ok,
      realtimeProjection,
    } satisfies IndexingStatusResponseOk),
  );
});

export default app;
