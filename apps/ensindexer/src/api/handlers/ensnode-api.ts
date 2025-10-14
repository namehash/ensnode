import { publicClients } from "ponder:api";
import {
  IndexingStatusResponseCodes,
  IndexingStatusResponseError,
  IndexingStatusResponseOk,
  OmnichainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  serializeENSIndexerPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import {
  buildOmnichainIndexingStatusSnapshot,
  createCrossChainIndexingStatusSnapshotOmnichain,
} from "@/api/lib/indexing-status";
import config from "@/config";
import { buildENSIndexerPublicConfig } from "@/config/public";
import { getUnixTime } from "date-fns";
import resolutionApi from "./resolution-api";

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

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
    omnichainSnapshot = await buildOmnichainIndexingStatusSnapshot(publicClients);
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

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
