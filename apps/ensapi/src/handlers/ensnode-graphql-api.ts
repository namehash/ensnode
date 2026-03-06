import config from "@/config";

import { hasGraphqlApiConfigSupport } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

const app = factory.createApp();

// 503 if ensv2 plugin not available
app.use(async (c, next) => {
  const prerequisite = hasGraphqlApiConfigSupport(config.ensIndexerPublicConfig);
  if (!prerequisite.supported) {
    return c.text(`Service Unavailable: ${prerequisite.reason}`, 503);
  }

  await next();
});

app.use(async (c) => {
  // defer the loading of the GraphQL Server until runtime, which allows these modules to require
  // the Namechain datasource
  // TODO(ensv2): this can be removed if/when all ENSNamespaces define the Namechain Datasource
  const { yoga } = await import("@/graphql-api/yoga");
  return yoga.fetch(c.req.raw, c.var);
});

export default app;
