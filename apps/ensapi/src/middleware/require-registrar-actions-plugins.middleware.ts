import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

/**
 * Required plugins to enable Registrar Actions API routes.
 */
const requiredPlugins = [
  PluginName.Subgraph,
  PluginName.Basenames,
  PluginName.Lineanames,
  PluginName.Registrars,
] as const;

/**
 * Creates middleware that requires a specific plugins to be enabled in ENSIndexer
 * in order to support the Registrar Actions API routes.
 *
 * Returns a 404 Not Found response if the required plugins are not enabled
 * in the connected ENSIndexer configuration.
 *
 * @returns Hono middleware that validates plugin availability
 */
export const requireRegistrarActionsPluginsMiddleware = () =>
  factory.createMiddleware(async (c, next) => {
    // If all required plugins were activated on the ENSIndexer instance.
    if (requiredPlugins.every((plugin) => config.ensIndexerPublicConfig.plugins.includes(plugin))) {
      // Execute the API route handler
      await next();
    } else {
      // Otherwise, return a not found response.
      return c.notFound();
    }
  });
