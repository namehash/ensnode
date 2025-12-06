import config from "@/config";

import {
  NameTokensResponseCodes,
  NameTokensResponseErrorCodes,
  nameTokensPrerequisites,
  serializeNameTokensResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("name-tokens.middleware");

/**
 * Name Tokens API Middleware
 *
 * This middleware that ensures that all prerequisites of
 * the Name Tokens API were met and HTTP requests can be served.
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
export const nameTokensApiMiddleware = factory.createMiddleware(
  async function nameTokensApiMiddleware(c, next) {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(name-tokens.middleware): indexingStatusMiddleware required`);
    }

    if (!nameTokensPrerequisites.hasEnsIndexerConfigSupport(config.ensIndexerPublicConfig)) {
      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.Generic,
          error: {
            message: `Name Tokens API is not available`,
            details: `Connected ENSIndexer must have all following plugins active: ${nameTokensPrerequisites.requiredPlugins.join(", ")}`,
          },
        }),
        500,
      );
    }

    if (c.var.indexingStatus.isRejected) {
      // no indexing status available in context
      logger.error(
        {
          error: c.var.indexingStatus.reason,
        },
        `Name Tokens API requested but indexing status is not available in context.`,
      );

      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.Generic,
          error: {
            message: `Name Tokens API is not available`,
            details: `Indexing status is currently unavailable to this ENSApi instance.`,
          },
        }),
        500,
      );
    }

    const { omnichainSnapshot } = c.var.indexingStatus.value.snapshot;

    if (!nameTokensPrerequisites.hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus))
      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.Generic,
          error: {
            message: `Name Tokens API is not available`,
            details: `The cached omnichain indexing status of the Connected ENSIndexer must be one of the following ${nameTokensPrerequisites.supportedIndexingStatusIds.map((statusId) => `"${statusId}"`).join(", ")}.`,
          },
        }),
        500,
      );

    await next();
  },
);
