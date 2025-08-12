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
import { assertRealtimeIndexingDistance, buildIndexingStatus } from "@/indexing-status";

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
    console.error(
      `Indexing Status is not currently available for '${OverallIndexingStatusIds.IndexerError}' overall status.`,
    );

    return c.json(serializedIndexingStatus, 503);
  }

  const maxRealtimeDistanceQueryParam = c.req.query("maxRealtimeDistance");

  // assert realtime indexing distance if `maxRealtimeDistanceQueryParam` was provided
  if (typeof maxRealtimeDistanceQueryParam !== "undefined") {
    try {
      assertRealtimeIndexingDistance(indexingStatus, maxRealtimeDistanceQueryParam);
    } catch (error) {
      // return bad request error if query param was not valid
      if (error instanceof RangeError) {
        return c.text(
          `Could not parse "maxRealtimeDistance" query param. If provided, it must represent a non-negative integer.`,
          400,
        );
      }

      // return 503 error if requested realtime indexing distance was not achieved
      if (error instanceof Error) {
        console.error(`Indexing Status is not currently available. ${error.message}`);

        return c.json(serializedIndexingStatus, 503);
      }
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
