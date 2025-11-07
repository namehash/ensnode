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
 * Creates middleware that ensures that all requirements of
 * the Registrar Actions API were met and HTTP request can be served.
 *
 * Returns a 404 Not Found response for any of the following cases:
 * 1) Not all required plugins are active in the connected ENSIndexer
 *    configuration.
 * 2) The maximum realtime has not been achieved by the connected
 *    ENSIndexer.
 *
 * @returns Hono middleware that validates the plugin availability.
 */
export const requireRegistrarActionsPluginMiddleware = () =>
  factory.createMiddleware(async (c, next) => {
    if (c.var.isRealtime === undefined) {
      throw new Error(
        `Invariant(requireRegistrarActionsPluginMiddleware): isRealtimeMiddleware expected`,
      );
    }

    const allRequiredPluginsActive = requiredPlugins.every((plugin) =>
      config.ensIndexerPublicConfig.plugins.includes(plugin),
    );

    if (!allRequiredPluginsActive || !c.var.isRealtime) {
      // Otherwise, return a not found response.
      return c.notFound();
    }

    await next();
  });
