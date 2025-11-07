import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

/**
 * Creates middleware that requires a specific core plugin to be enabled in ENSIndexer.
 *
 * Returns a 404 Not Found response if the required core plugin is not enabled
 * in the connected ENSIndexer configuration.
 *
 * @param core - The core plugin type to require ("subgraph" or "ensv2")
 * @returns Hono middleware that validates plugin availability
 */
export const requireCorePluginMiddleware = (core: "subgraph" | "ensv2") =>
  factory.createMiddleware(async (c, next) => {
    if (
      core === "subgraph" && //
      !config.ensIndexerPublicConfig.plugins.includes(PluginName.Subgraph)
    ) {
      return c.notFound();
    }

    // TODO: enable ensv2 checking
    if (
      core === "ensv2" && //
      !config.ensIndexerPublicConfig.plugins.includes(PluginName.ENSv2)
    ) {
      return c.notFound();
    }

    await next();
  });
