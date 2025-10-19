import packageJson from "@/../package.json" with { type: "json" };

import { Hono } from "hono";
import { cors } from "hono/cors";

import ensNodeApi from "./handlers/ensnode-api";
import subgraphApi from "./handlers/subgraph-api";

const app = new Hono();

// set the X-ENSNode-Version header to the current version
app.use(async (ctx, next) => {
  ctx.header("x-ensnode-version", packageJson.version);
  return next();
});

// use CORS middleware
app.use(cors({ origin: "*" }));

// use ENSNode HTTP API at /api
app.route("/api", ensNodeApi);

// use Subgraph GraphQL API at /subgraph
app.route("/subgraph", subgraphApi);

// log hono errors to console
app.onError((error, ctx) => {
  console.error(error);
  return ctx.text("Internal server error", 500);
});

export default app;
