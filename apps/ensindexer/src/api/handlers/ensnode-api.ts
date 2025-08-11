import { publicClients } from "ponder:api";
import {
  OverallIndexingStatusIds,
  serializeENSIndexerIndexingStatus,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import config from "@/config";
import { buildENSIndexerPublicConfig } from "@/config/public";
import { buildIndexingStatus } from "@/indexing-status";

import { makeNonNegativeIntegerSchema } from "@ensnode/ensnode-sdk/internal";
import z from "zod/v4";
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

// include ENSIndexer Overall Indexing Status endpoint
app.get("/indexing-status", async (c) => {
  // build the current indexing status object
  const indexingStatus = await buildIndexingStatus(publicClients);
  const serializedIndexingStatus = serializeENSIndexerIndexingStatus(indexingStatus);

  // return 503 error if ENSIndexer is not available
  if (indexingStatus.overallStatus === OverallIndexingStatusIds.IndexerError) {
    return c.json(serializedIndexingStatus, 503);
  }

  const maxRealtimeDistanceQueryParam = c.req.query("maxRealtimeDistance");

  // apply short circuit if no particular realtime indexing distance was requested
  if (typeof maxRealtimeDistanceQueryParam === "undefined") {
    // respond with the serialized indexing status object
    return c.json(serializedIndexingStatus);
  }

  // otherwise,
  // try parsing the optional "maxRealtimeDistance" query param
  const maxRealtimeDistanceParsed = z.coerce
    .number()
    .pipe(makeNonNegativeIntegerSchema("maxRealtimeDistance"))
    .optional()
    .safeParse(maxRealtimeDistanceQueryParam);

  // return a bad request error if provided value was invalid
  if (maxRealtimeDistanceParsed.error) {
    return c.text(
      `Could not parse "maxRealtimeDistance" query param. If provided, it must represent a non-negative integer.`,
      400,
    );
  }

  const requestedRealtimeIndexingDistance = maxRealtimeDistanceParsed.data!;

  // return 503 error if the overall indexing status is other than 'following'
  if (indexingStatus.overallStatus !== OverallIndexingStatusIds.Following) {
    // return 503
    return c.json(serializedIndexingStatus, 503);
  }

  const hasNotAchievedRequestedRealtimeIndexingDistance =
    indexingStatus.approximateRealtimeDistance > requestedRealtimeIndexingDistance;

  // return 503 error if the requested realtime indexing distance
  // has not been achieved yet
  if (hasNotAchievedRequestedRealtimeIndexingDistance) {
    return c.json(serializedIndexingStatus, 503);
  }

  // respond with the serialized indexing status object
  return c.json(serializedIndexingStatus);
});

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
