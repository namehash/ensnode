import { publicClients } from "ponder:api";
import {
  IndexingStatusResponseCodes,
  IndexingStatusResponseError,
  IndexingStatusResponseOk,
  OmnichainIndexingStatusSnapshot,
  createRealtimeStatusProjection,
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
  const systemTimestamp = getUnixTime(new Date());

  let omnichainSnapshot: OmnichainIndexingStatusSnapshot | undefined;

  try {
    omnichainSnapshot = await buildOmnichainIndexingStatusSnapshot(publicClients);
  } catch (error) {
    console.error(`Omnichain snapshot is currently not available.`);
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
    systemTimestamp,
  );

  const now = getUnixTime(new Date());
  const realtimeProjection = createRealtimeStatusProjection(crossChainSnapshot, now);

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
