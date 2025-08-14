import { publicClients } from "ponder:api";
import {
  Duration,
  OverallIndexingStatusIds,
  deserializeDuration,
  serializeENSIndexerIndexingStatus,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import config from "@/config";
import { buildENSIndexerPublicConfig } from "@/config/public";
import { buildIndexingStatus, hasAchievedRequestedDistance } from "@/indexing-status";

import resolutionApi from "../lib/resolution-api";

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
  const indexingStatus = await buildIndexingStatus(publicClients);
  const serializedIndexingStatus = serializeENSIndexerIndexingStatus(indexingStatus);

  // respond with 503 error if ENSIndexer is not available
  if (indexingStatus.overallStatus === OverallIndexingStatusIds.IndexerError) {
    return c.json(serializedIndexingStatus, 503);
  }

  const maxRealtimeDistanceQueryParam = c.req.query("maxRealtimeDistance");

  // ensure the requested realtime indexing distance was achieved only if
  // 'maxRealtimeDistance' value was provided
  if (maxRealtimeDistanceQueryParam) {
    let requestedRealtimeIndexingDistance: Duration;

    // try deserializing duration
    try {
      requestedRealtimeIndexingDistance = deserializeDuration(
        maxRealtimeDistanceQueryParam,
        "maxRealtimeDistance",
      );
    } catch (error) {
      // respond with 400 error if query param didn't represent valid Duration
      return c.text(`'maxRealtimeDistance' must be a valid Duration value.`, 400);
    }

    const hasAchievedRequestedRealtimeIndexingDistance = hasAchievedRequestedDistance(
      indexingStatus,
      requestedRealtimeIndexingDistance,
    );

    // respond with 503 error if requested distance wasn't achieved
    if (!hasAchievedRequestedRealtimeIndexingDistance) {
      return c.json(serializedIndexingStatus, 503);
    }
  }

  // respond with the serialized indexing status object
  return c.json(serializedIndexingStatus);
});

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
