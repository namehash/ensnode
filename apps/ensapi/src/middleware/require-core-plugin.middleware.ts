import { factory } from "@/lib/hono-factory";
import { PluginName } from "@ensnode/ensnode-sdk";

// TODO: move this `core` union to a shared enum and implement shared isCorePluginEnabled
// logic to rectify the subgraph,basenames,lineanames,threedns unity
export const requireCorePluginMiddleware = (core: "subgraph" | "ensv2") =>
  factory.createMiddleware(async (c, next) => {
    if (
      core === "subgraph" &&
      !c.var.ensIndexerPublicConfig.plugins.includes(PluginName.Subgraph)
    ) {
      return c.notFound();
    }

    // TODO: enable ensv2 checking
    if (core === "ensv2") {
      return c.notFound();
    }

    await next();
  });
