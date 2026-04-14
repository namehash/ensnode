import packageJson from "@/../package.json" with { type: "json" };

import { otel } from "@hono/otel";
import { cors } from "hono/cors";
import { html } from "hono/html";

import { errorResponse } from "@/lib/handlers/error-response";
import { createApp } from "@/lib/hono-factory";
import logger from "@/lib/logger";
import { generateOpenApi31Document } from "@/openapi-document";

import realtimeApi from "./handlers/api/meta/realtime-api";
import apiRouter from "./handlers/api/router";
import ensanalyticsApi from "./handlers/ensanalytics/ensanalytics-api";
import ensanalyticsApiV1 from "./handlers/ensanalytics/ensanalytics-api-v1";
import subgraphApi from "./handlers/subgraph/subgraph-api";

const app = createApp();

// set the X-ENSNode-Version response header to the current version
app.use(async (ctx, next) => {
  ctx.header("x-ensnode-version", packageJson.version);
  return next();
});

// use CORS middleware
app.use(cors({ origin: "*" }));

// include automatic OpenTelemetry instrumentation for incoming requests
app.use(otel());

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
    <p>You've reached the root of an ENSApi instance. You might be looking for the <a href="https://ensnode.io/docs">ENSNode documentation</a>.</p>
</body>
</html>
`),
);

// use ENSNode HTTP API at /api
app.route("/api", apiRouter);

// use Subgraph GraphQL API at /subgraph
app.route("/subgraph", subgraphApi);

// use ENSAnalytics API at /ensanalytics (v0, implicit)
app.route("/ensanalytics", ensanalyticsApi);

// use ENSAnalytics API v1 at /v1/ensanalytics
app.route("/v1/ensanalytics", ensanalyticsApiV1);

// use Am I Realtime API at /amirealtime
// NOTE: this is legacy endpoint and will be deleted in future. one should use /api/realtime instead
app.route("/amirealtime", realtimeApi);

// generate and return OpenAPI 3.1 document
app.get("/openapi.json", (c) => {
  return c.json(generateOpenApi31Document(app));
});

app.get("/health", async (c) => {
  return c.json({ message: "fallback ok" });
});

// log hono errors to console
app.onError((error, ctx) => {
  logger.error(error);
  return errorResponse(ctx, "Internal Server Error");
});

export default app;
