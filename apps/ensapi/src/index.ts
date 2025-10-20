import packageJson from "@/../package.json" with { type: "json" };

import { serve } from "@hono/node-server";
import { otel } from "@hono/otel";
import { cors } from "hono/cors";

import config from "@/config";
import { errorResponse } from "@/lib/handlers/error-response";
import { factory } from "@/lib/hono-factory";
import { sdk } from "@/lib/tracing/instrumentation";
import { canAccelerateMiddleware } from "@/middleware/can-accelerate.middleware";
import { ensIndexerPublicConfigMiddleware } from "@/middleware/ensindexer-public-config.middleware";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
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
// NOTE: required for protocol tracing
app.use(otel());

// add ENSAPI Middlewares to all routes for convenience
// NOTE: must mirror Variables type in apps/ensapi/src/lib/hono-factory.ts or c.var.* will not be
// available at runtime
app.use(ensIndexerPublicConfigMiddleware);
app.use(indexingStatusMiddleware);
app.use(canAccelerateMiddleware);

// use ENSNode HTTP API at /api
app.route("/api", ensNodeApi);

// use Subgraph GraphQL API at /subgraph
// TODO(ensv2): include core-schema-checking middleware to conditionally 404
app.route("/subgraph", subgraphApi);

// log hono errors to console
app.onError((error, ctx) => {
  console.error(error);
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
  (info) => {
    console.log(`ENSAPI listening on port ${info.port} with config:`);
    // TODO: pretty-print obfuscated EnsApiConfig
    console.log(JSON.stringify(config, null, 2));
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

const gracefulShutdown = async () => {
  try {
    await sdk.shutdown();
    await closeServer();

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// graceful shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
