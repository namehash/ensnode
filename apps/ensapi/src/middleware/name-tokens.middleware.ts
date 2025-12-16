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
 * This middleware ensures that all prerequisites of
 * the Name Tokens API were met and HTTP requests are ready for further
 * processing.
 *
 * Returns a 503 response for any of the following cases:
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
          errorCode: NameTokensResponseErrorCodes.EnsIndexerConfigUnsupported,
          error: {
            message: `Name Tokens API is not available`,
            details: `Connected ENSIndexer must have all following plugins active: ${nameTokensPrerequisites.requiredPlugins.join(", ")}`,
          },
        }),
        503,
      );
    }

    if (c.var.indexingStatus instanceof Error) {
      // no indexing status available in context
      logger.error(
        c.var.indexingStatus,
        `Name Tokens API requested but indexing status is not available in context yet.`,
      );

      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.IndexingStatusUnsupported,
          error: {
            message: `Name Tokens API is not available yet`,
            details: `The cached omnichain indexing status of the Connected ENSIndexer must be available.`,
          },
        }),
        503,
      );
    }

    const { omnichainSnapshot } = c.var.indexingStatus.snapshot;

    if (!nameTokensPrerequisites.hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus))
      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.IndexingStatusUnsupported,
          error: {
            message: `Name Tokens API is not available yet`,
            details: `The cached omnichain indexing status of the Connected ENSIndexer must be one of the following ${nameTokensPrerequisites.supportedIndexingStatusIds.map((statusId) => `"${statusId}"`).join(", ")}. The current status is "${omnichainSnapshot.omnichainStatus}"`,
          },
        }),
        503,
      );

    await next();
  },
);
