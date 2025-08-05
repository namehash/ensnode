import config from "@/config";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import { buildENSIndexerPublicConfig } from "@/config/helpers";
import { getDependencyInfo } from "@/lib/version-info";
import { serializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import resolutionApi from "../lib/resolution-api";

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  // fetch the current state of dependency info
  const dependencyInfo = await getDependencyInfo();

  // prepare the public config object, including dependency info
  const publicConfig = buildENSIndexerPublicConfig(config, dependencyInfo);

  // serialize the public config object
  const serializedPublicConfig = serializeENSIndexerPublicConfig(publicConfig);

  // respond with the serialized public config object
  return c.json(serializedPublicConfig);
});

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
