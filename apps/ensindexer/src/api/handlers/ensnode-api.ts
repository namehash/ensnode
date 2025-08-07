import { publicClients } from "ponder:api";
import {
  serializeENSIndexerIndexingStatus,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import config from "@/config";
import { buildENSIndexerPublicConfig } from "@/config/public";
import { buildIndexingStatus } from "@/indexing-status";

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

// include ENSIndexer Indexing Status endpoint
app.get("/indexing-status", async (c) => {
  // build the current indexing status object
  const indexingStatus = await buildIndexingStatus(publicClients);

  // respond with the serialized indexing status object
  return c.json(serializeENSIndexerIndexingStatus(indexingStatus));
});

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
