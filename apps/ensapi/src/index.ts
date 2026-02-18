import packageJson from "@/../package.json" with { type: "json" };
import config from "@/config";

import { serve } from "@hono/node-server";
import { otel } from "@hono/otel";
import { cors } from "hono/cors";
import { html } from "hono/html";

import { indexingStatusCache } from "@/cache/indexing-status.cache";
import { getReferralLeaderboardEditionsCaches } from "@/cache/referral-leaderboard-editions.cache";
import { referralProgramEditionConfigSetCache } from "@/cache/referral-program-edition-set.cache";
import { referrerLeaderboardCache } from "@/cache/referrer-leaderboard.cache";
import { redactEnsApiConfig } from "@/config/redact";
import { errorResponse } from "@/lib/handlers/error-response";
import { createApp } from "@/lib/hono-factory";
import { sdk } from "@/lib/instrumentation";
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

// use Subgraph GraphQL API at /subgraph
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

    // Destroy referral program edition config set cache
    referralProgramEditionConfigSetCache.destroy();
    logger.info("Destroyed referralProgramEditionConfigSetCache");

    // Destroy all edition caches (if initialized)
    const editionsCaches = getReferralLeaderboardEditionsCaches();
    if (editionsCaches) {
      for (const [editionSlug, cache] of editionsCaches) {
        cache.destroy();
        logger.info(`Destroyed referralLeaderboardEditionsCache for ${editionSlug}`);
      }
    }

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
