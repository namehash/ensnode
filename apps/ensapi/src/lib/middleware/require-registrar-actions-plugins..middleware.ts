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
 *
 * 1. `registrars` plugin is required so that data in the `registrarActions`
 *    table is populated.
 * 2. `subgraph`, `basenames`, and `lineanames` are required to get the data
 *    for the name associated with each registrar action.
 * 3. In theory not all of `subgraph`, `basenames`, and `lineanames` plugins
 *    might be required. Ex: At least one, but the current logic in
 *    the `registrars` plugin always indexes registrar actions across
 *    Ethnames (subgraph), Basenames, and Lineanames and therefore we need to
 *    ensure each value in the registrar actions table has
 *    an associated record in the domains table.
 */
const requiredPlugins = [
  PluginName.Subgraph,
  PluginName.Basenames,
  PluginName.Lineanames,
  PluginName.Registrars,
] as const;

/**
 * Creates middleware that ensures that all prerequisites of
 * the Registrar Actions API were met and HTTP requests can be served.
 *
 * Returns a 500 response for any of the following cases:
 * 1) Not all required plugins are active in the connected ENSIndexer
 *    configuration.
 * 2) The connected ENSIndexer cannot serve Indexing Status.
 * 3) The omnichain indexing status of the connected ENSIndexer is other than
 *    "completed" or "following".
 *
 * @returns Hono middleware that validates the plugin's HTTP API availability.
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
        500,
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
        500,
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
        500,
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
            details: `The omnichain indexing status of the Connected ENSIndexer must be either "completed" or "following".`,
          },
        }),
        500,
      );

    await next();
  });
