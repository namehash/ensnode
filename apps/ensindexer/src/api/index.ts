import packageJson from "@/../package.json";

import { Hono } from "hono";
import { cors } from "hono/cors";

import { sdk } from "@/api/lib/tracing/instrumentation";

import ensNodeApi from "./handlers/ensnode-api";
import metadataApi from "./handlers/metadata-api";
import subgraphApi from "./handlers/subgraph-api";

const app = new Hono();

// set the X-ENSNode-Version header to the current version
app.use(async (ctx, next) => {
  ctx.header("x-ensnode-version", packageJson.version);
  return next();
});

// use CORS middleware
app.use(cors({ origin: "*" }));

// use ENSNode Metadata API at /metadata
app.route("/metadata", metadataApi);

// use ENSNode HTTP API at /api
app.route("/api", ensNodeApi);

// use Subgraph GraphQL API at /subgraph
app.route("/subgraph", subgraphApi);

// log hono errors to console
app.onError((error, ctx) => {
  console.error(error);
  return ctx.text("Internal server error", 500);
});

// start ENSNode API OpenTelemetry SDK
sdk.start();

// gracefully shut down the SDK on process interrupt/exit
const shutdownOpenTelemetry = () =>
  sdk.shutdown().catch((error) => console.error("Error terminating tracing", error));
process.on("SIGINT", shutdownOpenTelemetry);
process.on("SIGTERM", shutdownOpenTelemetry);

export default app;
