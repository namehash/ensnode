import packageJson from "@/../package.json" with { type: "json" };

import { Hono } from "hono";
import { cors } from "hono/cors";

import type { ErrorResponse } from "@ensnode/ensnode-sdk";

import { startEnsDbWriterWorker } from "@/lib/ensdb-writer-worker/singleton";

import ensNodeApi from "./handlers/ensnode-api";

// The entry point for the ENSDb Writer Worker. It must be placed inside
// the `api` directory of the Ponder app to avoid the following build issue:
// Error: Invalid dependency graph. Config, schema, and indexing function files
// cannot import objects from the API function file "src/api/index.ts".
startEnsDbWriterWorker();

const app = new Hono();

// set the X-ENSIndexer-Version header to the current version
app.use(async (ctx, next) => {
  ctx.header("x-ensindexer-version", packageJson.version);
  return next();
});

// use CORS middleware
app.use(cors({ origin: "*" }));

// use ENSNode HTTP API at /api
app.route("/api", ensNodeApi);

// log hono errors to console
app.onError((error, ctx) => {
  console.error(error);
  return ctx.json({ message: "Internal Server Error" } satisfies ErrorResponse, 500);
});

export default app;
