import { createApp } from "@/lib/hono-factory";
import { requireCorePluginMiddleware } from "@/middleware/require-core-plugin.middleware";

const app = createApp();

app.use(requireCorePluginMiddleware("ensv2"));
app.use(async (c) => {
  // defer the loading of the GraphQL Server until runtime, which allows these modules to require
  // the Namechain datasource
  // TODO(ensv2): this can be removed if/when all ENSNamespaces define the Namechain Datasource
  const { yoga } = await import("@/graphql-api/yoga");
  return yoga.fetch(c.req.raw, c.var);
});

export default app;
