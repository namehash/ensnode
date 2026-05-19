import packageJson from "@/../package.json" with { type: "json" };

import { Hono } from "hono";
import { cors } from "hono/cors";

import type { ErrorResponse } from "@ensnode/ensnode-sdk";

import { logger } from "@/lib/logger";

import ensNodeApi from "./handlers/ensnode-api";

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
  logger.error({
    msg: "Internal server error",
    error,
    path: ctx.req.path,
    module: "ponder-api",
  });
  return ctx.json({ message: "Internal Server Error" } satisfies ErrorResponse, 500);
});

export default app;
