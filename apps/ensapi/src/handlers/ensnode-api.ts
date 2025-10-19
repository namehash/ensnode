import { Hono } from "hono";

import resolutionApi from "./resolution-api";

const app = new Hono();

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  // TODO: proxy ensindexer api/config
});

app.get("/indexing-status", async (c) => {
  // TODO: proxt ensindexer api/indexing-status
});

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
