import packageJson from "@/../package.json" with { type: "json" };
import config from "@/config";

import { serve } from "@hono/node-server";
import { otel } from "@hono/otel";
import type { Duration } from "@namehash/ens-referrals";
import { minutesToSeconds } from "date-fns";
import { cors } from "hono/cors";
import z from "zod/v4";

import { makeDurationSchema, prettyPrintJson } from "@ensnode/ensnode-sdk/internal";

import { indexingStatusCache } from "@/cache/indexing-status.cache";
import { referrerLeaderboardCache } from "@/cache/referrer-leaderboard.cache";
import { redactEnsApiConfig } from "@/config/redact";
import { errorResponse } from "@/lib/handlers/error-response";
import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { sdk } from "@/lib/instrumentation";
import logger from "@/lib/logger";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";

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

// use ENSNode HTTP API at /api
app.route("/api", ensNodeApi);

// use Subgraph GraphQL API at /subgraph
app.route("/subgraph", subgraphApi);

// use ENSAnalytics API at /ensanalytics
app.route("/ensanalytics", ensanalyticsApi);

// will automatically 500 if config is not available due to ensIndexerPublicConfigMiddleware
app.get("/health", async (c) => {
  return c.json({ ok: true });
});

// Set default `maxRealtimeDistance` for `GET /amirealtime` endpoint to one minute.
const AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE: Duration = minutesToSeconds(1);

// allow performance monitoring clients to read HTTP Status for the provided
// `maxRealtimeDistance` param
app.get(
  "/amirealtime",
  validate(
    "query",
    z.object({
      maxRealtimeDistance: params.queryParam
        .optional()
        .default(AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE)
        .pipe(makeDurationSchema("maxRealtimeDistance query param")),
    }),
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(amirealtime): indexingStatusMiddleware required.`);
    }

    if (c.var.indexingStatus instanceof Error) {
      throw new Error(
        `Invariant(amirealtime): Indexing Status has to be resolved successfully before 'maxRealtimeDistance' can be applied.`,
      );
    }

    const { maxRealtimeDistance } = c.req.valid("query");
    const { worstCaseDistance, snapshot } = c.var.indexingStatus;
    const { slowestChainIndexingCursor } = snapshot;

    // return 503 response error with details on
    // requested `maxRealtimeDistance` vs. actual `worstCaseDistance`
    if (worstCaseDistance > maxRealtimeDistance) {
      return errorResponse(
        c,
        new Error(
          `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxRealtimeDistance'; worstCaseDistance = ${worstCaseDistance}; maxRealtimeDistance = ${maxRealtimeDistance}`,
        ),
        503,
      );
    }

    // return 200 response OK with current details on `maxRealtimeDistance`,
    // `slowestChainIndexingCursor`, and `worstCaseDistance`
    return c.json({ maxRealtimeDistance, slowestChainIndexingCursor, worstCaseDistance });
  },
);

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
    logger.info(
      `ENSApi listening on port ${info.port} with config:\n${prettyPrintJson(redactEnsApiConfig(config))}`,
    );

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
