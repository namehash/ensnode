import config from "@/config";

import {
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultServiceUnavailable,
  getChainIndexingConfigTypeId,
  getSufficientIndexingProgressChainCursor,
  getTimestampForLowestOmnichainStartBlock,
  ResultInsufficientIndexingProgress,
  ResultInternalServerError,
  ResultServiceUnavailable,
  registrarActionsPrerequisites,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { resultIntoHttpResponse } from "@/lib/result/result-into-http-response";

const logger = makeLogger("registrar-actions.middleware");

/**
 * Registrar Actions API Middleware
 *
 * This middleware ensures that all prerequisites of
 * the Registrar Actions API were met and HTTP requests can be served.
 *
 * Returns a response from {@link ResultInternalServerError} for any of
 * the following cases:
 * 1) The application context does not have the indexing status set by
 *   `indexingStatusMiddleware`.
 *
 * Returns a response from {@link ResultServiceUnavailable} for any of
 * the following cases:
 * 1) Not all required plugins are active in the connected ENSIndexer
 *    configuration.
 * 2) ENSApi has not yet successfully cached the Indexing Status in memory from
 *    the connected ENSIndexer.
 *
 * Returns a response from {@link ResultInsufficientIndexingProgress} for any of
 * the following cases:
 * 1) The omnichain indexing status of the connected ENSIndexer that is cached
 *    in memory is not "completed" or "following".
 *
 * @returns Hono middleware that validates the plugin's HTTP API availability.
 */
export const registrarActionsApiMiddleware = factory.createMiddleware(
  async function registrarActionsApiMiddleware(c, next) {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      const result = buildResultInternalServerError(
        `Invariant(registrar-actions.middleware): indexingStatusMiddleware required.`,
      );

      return resultIntoHttpResponse(c, result);
    }

    if (!registrarActionsPrerequisites.hasEnsIndexerConfigSupport(config.ensIndexerPublicConfig)) {
      const errorMessage = [
        `Registrar Actions API is not available.`,
        `Connected ENSIndexer configuration does not have all required plugins active.`,
        `Current plugins: "${config.ensIndexerPublicConfig.plugins.join(", ")}".`,
        `Required plugins: "${registrarActionsPrerequisites.requiredPlugins.join(", ")}".`,
      ].join(" ");

      const result = buildResultServiceUnavailable(errorMessage);

      return resultIntoHttpResponse(c, result);
    }

    if (c.var.indexingStatus instanceof Error) {
      // no indexing status available in context
      logger.error(
        c.var.indexingStatus,
        `Registrar Actions API requested but indexing status is not available in context.`,
      );

      const errorMessage = [
        `Registrar Actions API is not available.`,
        `Indexing status is currently unavailable to this ENSApi instance.`,
      ].join(" ");

      const result = buildResultServiceUnavailable(errorMessage);

      return resultIntoHttpResponse(c, result);
    }

    const { snapshot, worstCaseDistance } = c.var.indexingStatus;
    const { omnichainSnapshot, slowestChainIndexingCursor } = snapshot;

    const chains = Array.from(omnichainSnapshot.chains.values());
    const configTypeId = getChainIndexingConfigTypeId(chains);

    if (
      !registrarActionsPrerequisites.hasIndexingStatusSupport(
        configTypeId,
        omnichainSnapshot.omnichainStatus,
      )
    ) {
      const earliestChainIndexingCursor = getTimestampForLowestOmnichainStartBlock(chains);
      const progressSufficientFromChainIndexingCursor = getSufficientIndexingProgressChainCursor(
        slowestChainIndexingCursor,
        worstCaseDistance,
        0,
      );

      const targetIndexingStatus =
        registrarActionsPrerequisites.getSupportedIndexingStatus(configTypeId);

      const errorMessage = [
        `Registrar Actions API is not available.`,
        `The cached omnichain indexing status of the connected ENSIndexer has insufficient progress.`,
      ].join(" ");

      const result = buildResultInsufficientIndexingProgress(errorMessage, {
        indexingStatus: omnichainSnapshot.omnichainStatus,
        slowestChainIndexingCursor,
        earliestChainIndexingCursor,
        progressSufficientFrom: {
          indexingStatus: targetIndexingStatus,
          chainIndexingCursor: progressSufficientFromChainIndexingCursor,
        },
      });

      return resultIntoHttpResponse(c, result);
    }

    await next();
  },
);
