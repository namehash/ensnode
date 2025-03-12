import { Hono } from "hono";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";

import v1 from "./v1";

const app = new Hono();

// use cors
app.use(cors({ origin: "*" }));

// TODO: ENSNode-api should be the exclusive api entrypoint for ENSNode
// https://hono.dev/examples/proxy
// - proxy /ponder, /subgraph, /sql/* endpoints to ensindexer

app.route("/api/v1", v1);

export default {
  port: 3289,
  fetch: app.fetch,
};
