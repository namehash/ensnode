import packageJson from "@/../package.json" with { type: "json" };
import config from "@/config";

import { serve } from "@hono/node-server";
import { otel } from "@hono/otel";
import { cors } from "hono/cors";
import { html } from "hono/html";

import { indexingStatusCache } from "@/cache/indexing-status.cache";
import { referrerLeaderboardCache } from "@/cache/referrer-leaderboard.cache";
import { redactEnsApiConfig } from "@/config/redact";
import { errorResponse } from "@/lib/handlers/error-response";
import { factory } from "@/lib/hono-factory";
import { sdk } from "@/lib/instrumentation";
import logger from "@/lib/logger";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";

import amIRealtimeApi from "./handlers/amirealtime-api";
import ensanalyticsApi from "./handlers/ensanalytics-api";
import ensNodeApi from "./handlers/ensnode-api";
import subgraphApi from "./handlers/subgraph-api";

const app = factory.createApp();

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
app.route("/api", ensNodeApi);

// use Subgraph GraphQL API at /subgraph
app.route("/subgraph", subgraphApi);

// use ENSAnalytics API at /ensanalytics
app.route("/ensanalytics", ensanalyticsApi);

// use Am I Realtime API at /amirealtime
app.route("/amirealtime", amIRealtimeApi);

// will automatically 500 if config is not available due to ensIndexerPublicConfigMiddleware
app.get("/health", async (c) => {
  return c.json({ message: "fallback ok" });
});

// log hono errors to console
app.onError((error, ctx) => {
  logger.error(error);
  return errorResponse(ctx, "Internal Server Error");
});

// start ENSNode API OpenTelemetry SDK
sdk.start();

// start hono server
const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  async (info) => {
    logger.info({ config: redactEnsApiConfig(config) }, `ENSApi listening on port ${info.port}`);

    // self-healthcheck to connect to ENSIndexer & warm Indexing Status cache
    await app.request("/health");
  },
);

// promisify hono server.close
const closeServer = () =>
  new Promise<void>((resolve, reject) =>
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    }),
  );

// perform graceful shutdown
const gracefulShutdown = async () => {
  try {
    await sdk.shutdown();
    logger.info("Destroyed tracing instrumentation");

    referrerLeaderboardCache.destroy();
    logger.info("Destroyed referrerLeaderboardCache");

    indexingStatusCache.destroy();
    logger.info("Destroyed indexingStatusCache");

    await closeServer();
    logger.info("Closed application server");

    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

// graceful shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

process.on("uncaughtException", async (error) => {
  logger.error(error, "uncaughtException");
  await gracefulShutdown();
});
