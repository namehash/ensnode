import config from "@/config";

import {
  RegistrarActionsResponseCodes,
  registrarActionsPrerequisites,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("registrar-actions.middleware");

/**
 * Registrar Actions API Middleware
 *
 * This middleware that ensures that all prerequisites of
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
export const registrarActionsApiMiddleware = factory.createMiddleware(
  async function registrarActionsApiMiddleware(c, next) {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(registrar-actions.middleware): indexingStatusMiddleware required`);
    }

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

    if (c.var.indexingStatus instanceof Error) {
      // no indexing status available in context
      logger.error(
        c.var.indexingStatus,
        `Registrar Actions API requested but indexing status is not available in context.`,
      );

      return c.json(
        serializeRegistrarActionsResponse({
          responseCode: RegistrarActionsResponseCodes.Error,
          error: {
            message: `Registrar Actions API is not available`,
            details: `Indexing status is currently unavailable to this ENSApi instance.`,
          },
        }),
        500,
      );
    }

    const { omnichainSnapshot } = c.var.indexingStatus.snapshot;

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
  },
);
