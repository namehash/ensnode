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
import { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import { localPonderClient } from "@/lib/local-ponder-client";

const app = new Hono();
const indexingStatusBuilder = new IndexingStatusBuilder(localPonderClient);

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
    omnichainSnapshot = await indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Omnichain snapshot is currently not available: ${errorMessage}`);
  }

  // return IndexingStatusResponseError
  if (typeof omnichainSnapshot === "undefined") {
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }

  // otherwise, proceed with creating IndexingStatusResponseOk
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
