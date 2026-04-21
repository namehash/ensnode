import { hasOmnigraphApiConfigSupport } from "@ensnode/ensnode-sdk";

import { createApp } from "@/lib/hono-factory";
import { ensureEnsNodeStackInfoAvailable } from "@/middleware/stack-info.middleware";

const app = createApp();

// 503 if prerequisites not met
app.use(async (c, next) => {
  ensureEnsNodeStackInfoAvailable(c);
  const ensIndexerPublicConfig = c.var.stackInfo.ensIndexer;
  const prerequisite = hasOmnigraphApiConfigSupport(ensIndexerPublicConfig);
  if (!prerequisite.supported) {
    return c.text(`Service Unavailable: ${prerequisite.reason}`, 503);
  }

  await next();
});

app.use(async (c) => {
  ensureEnsNodeStackInfoAvailable(c);
  const { namespace } = c.var.stackInfo.ensIndexer;
  // defer the loading of the GraphQL Server until runtime, which allows these modules to require
  // the Namechain datasource
  // TODO(ensv2): this can be removed if/when all ENSNamespaces define the Namechain Datasource
  const { createYogaForNamespace } = await import("@/omnigraph-api/yoga");
  const yoga = createYogaForNamespace(namespace);
  return yoga.fetch(c.req.raw, c.var);
});

export default app;
