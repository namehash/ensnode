import config from "@/config";

import {
  IndexingStatusResponseCodes,
  RegistrarActionsResponseCodes,
  registrarActionsPrerequisites,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

/**
 * Creates middleware that ensures that all prerequisites of
 * the Registrar Actions API were met and HTTP requests can be served.
 *
 * Returns a 500 response for any of the following cases:
 * 1) Not all required plugins are active in the connected ENSIndexer
 *    configuration.
 * 2) ENSApi has not yet successfully cached the Indexing Status in memory from
 *    the connected ENSIndexer.
 * 3) The omnichain indexing status of the connected ENSIndexer that is cached
 *    in memory is not "completed" or "following".
 *
 * @returns Hono middleware that validates the plugin's HTTP API availability.
 */
export const requireRegistrarActionsPluginMiddleware = () =>
  factory.createMiddleware(async (c, next) => {
    if (!registrarActionsPrerequisites.hasEnsIndexerConfigSupport(config.ensIndexerPublicConfig)) {
      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `Connected ENSIndexer must have all following plugins active: ${registrarActionsPrerequisites.requiredPlugins.join(", ")}`,
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

    const { omnichainSnapshot } = indexingStatusResponse.realtimeProjection.snapshot;

    if (!registrarActionsPrerequisites.hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus))
      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `The cached omnichain indexing status of the Connected ENSIndexer must be one of the following ${registrarActionsPrerequisites.supportedIndexingStatusIds.map((statusId) => `"${statusId}"`).join(", ")}.`,
          },
        }),
        500,
      );

    await next();
  });
