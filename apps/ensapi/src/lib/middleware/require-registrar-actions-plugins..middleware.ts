import config from "@/config";

import {
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusIds,
  PluginName,
  RegistrarActionsResponseCodes,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

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
    const allRequiredPluginsActive = requiredPlugins.every((plugin) =>
      config.ensIndexerPublicConfig.plugins.includes(plugin),
    );

    if (!allRequiredPluginsActive) {
      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `Connected ENSIndexer must have all following plugins active: ${requiredPlugins.join(", ")}`,
          },
        }),
      );
    }

    if (c.var.indexingStatus.isRejected) {
      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `Connected ENSIndexer must make its Indexing Status API ready for connections.`,
          },
        }),
      );
    }

    const indexingStatusResponse = c.var.indexingStatus.value;

    if (indexingStatusResponse.responseCode === IndexingStatusResponseCodes.Error) {
      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `Connected ENSIndexer must serve its Indexing Status`,
          },
        }),
      );
    }

    const { omnichainStatus } =
      indexingStatusResponse.realtimeProjection.snapshot.omnichainSnapshot;

    // Database indexes are created by the time the omnichain indexing status
    // is either `completed` or `following`.
    const ensIndexerDatabaseIndexesCreated =
      omnichainStatus === OmnichainIndexingStatusIds.Completed ||
      omnichainStatus === OmnichainIndexingStatusIds.Following;

    if (!ensIndexerDatabaseIndexesCreated)
      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `Connected ENSIndexer must have database indexes created.`,
          },
        }),
      );

    await next();
  });
