/**
 * Application setup: creates the Hono app with all middleware and routes.
 *
 * Separated from index.ts (server startup/shutdown) so the app configuration
 * is distinct from the runtime lifecycle concerns.
 */

import packageJson from "@/../package.json" with { type: "json" };
import config from "@/config";

import { otel } from "@hono/otel";
import { cors } from "hono/cors";
import { html } from "hono/html";

import { errorResponse } from "@/lib/handlers/error-response";
import { createApp } from "@/lib/hono-factory";
import logger from "@/lib/logger";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
import { openapiDocumentation } from "@/openapi";

import amIRealtimeApi from "./handlers/amirealtime-api";
import { basePath as amIRealtimeBasePath } from "./handlers/amirealtime-api.routes";
import ensanalyticsApi from "./handlers/ensanalytics-api";
import { basePath as ensanalyticsBasePath } from "./handlers/ensanalytics-api.routes";
import ensanalyticsApiV1 from "./handlers/ensanalytics-api-v1";
import { basePath as ensanalyticsV1BasePath } from "./handlers/ensanalytics-api-v1.routes";
import ensNodeApi from "./handlers/ensnode-api";
import { basePath as ensnodeBasePath } from "./handlers/ensnode-api.routes";
import subgraphApi from "./handlers/subgraph-api";

const app = createApp();

// set the X-ENSNode-Version header to the current version
app.use(async (ctx, next) => {
  ctx.header("x-ensnode-version", packageJson.version);
  return next();
});

// use CORS middleware
app.use(cors({ origin: "*" }));

// include automatic OpenTelemetry instrumentation for incoming requests
app.use(otel());

// add ENSIndexer Indexing Status Middleware to all routes for convenience
app.use(indexingStatusMiddleware);

// host welcome page
app.get("/", (c) =>
  c.html(html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ENSApi</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>You've reached the root of an ENSApi instance. You might be looking for the <a href="https://ensnode.io/docs/">ENSNode documentation</a>.</p>
</body>
</html>
`),
);

// use ENSNode HTTP API at /api
app.route(ensnodeBasePath, ensNodeApi);

// Subgraph API is a GraphQL middleware handler, not an OpenAPI route,
// so it has no .routes.ts file or basePath export.
app.route("/subgraph", subgraphApi);

// use ENSAnalytics API at /ensanalytics (v0, implicit)
app.route(ensanalyticsBasePath, ensanalyticsApi);

// use ENSAnalytics API v1 at /v1/ensanalytics
app.route(ensanalyticsV1BasePath, ensanalyticsApiV1);

// use Am I Realtime API at /amirealtime
app.route(amIRealtimeBasePath, amIRealtimeApi);

// use OpenAPI Schema
app.doc31("/openapi.json", {
  ...openapiDocumentation,
  info: {
    ...openapiDocumentation.info,
    version: packageJson.version,
  },
  servers: [
    ...openapiDocumentation.servers,
    { url: `http://localhost:${config.port}`, description: "Local Development" },
  ],
});

// will automatically 503 if config is not available due to ensIndexerPublicConfigMiddleware
app.get("/health", async (c) => {
  return c.json({ message: "fallback ok" });
});

// log hono errors to console
app.onError((error, ctx) => {
  logger.error(error);
  return errorResponse(ctx, "Internal Server Error");
});

export default app;
