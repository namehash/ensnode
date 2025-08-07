import config from "@/config";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import { buildENSIndexerPublicConfig } from "@/config/public";
import { serializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
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

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
