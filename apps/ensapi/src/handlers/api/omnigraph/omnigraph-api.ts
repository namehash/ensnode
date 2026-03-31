import config from "@/config";

import { hasOmnigraphApiConfigSupport } from "@ensnode/ensnode-sdk";

import { createApp } from "@/lib/hono-factory";

const app = createApp();

// 503 if prerequisites not met
app.use(async (c, next) => {
  const prerequisite = hasOmnigraphApiConfigSupport(config.ensIndexerPublicConfig);
  if (!prerequisite.supported) {
    return c.text(`Service Unavailable: ${prerequisite.reason}`, 503);
  }

  await next();
});

app.use(async (c) => {
  // defer the loading of the GraphQL Server until runtime, which allows these modules to require
  // the Namechain datasource
  // TODO(ensv2): this can be removed if/when all ENSNamespaces define the Namechain Datasource
  const { yoga } = await import("@/omnigraph-api/yoga");
  return yoga.fetch(c.req.raw, c.var);
});

export default app;
