import config from "@/config";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import { serializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import resolutionApi from "../lib/resolution-api";

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

// include ENSIndexer Public Config endpoint
app.get("/config", (c) => c.json(serializeENSIndexerPublicConfig(config)));

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
