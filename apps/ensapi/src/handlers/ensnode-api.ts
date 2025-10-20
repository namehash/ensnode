import { factory } from "@/lib/hono-factory";

import resolutionApi from "./resolution-api";

const app = factory.createApp();

// include ENSIndexer Public Config endpoint
app.get("/config", (c) => {
  // TODO: handle settled state
  return c.json(c.var.ensIndexerPublicConfig);
});

// include ENSIndexer Indexing Status endpoint
app.get("/indexing-status", (c) => {
  // TODO: handle settled state
  return c.json(c.var.indexingStatus);
});

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
