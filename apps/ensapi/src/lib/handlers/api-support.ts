/**
 * This module provides helper functions to determine and build results related to
 * indexing status for ENSApi handlers that require specific indexing status support.
 */
import config from "@/config";

import {
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultOkIndexingStatusForSupportedApi,
  buildResultServiceUnavailable,
  getOmnichainIndexingConfigTypeId,
  getSupportedIndexingStatusForApiHandler,
  getTimestampForLowestOmnichainStartBlock,
  type IndexingStatusForSupportedApiResult,
  isApiHandlerSupportedByIndexingStatus,
  type PluginName,
} from "@ensnode/ensnode-sdk";

import type { MiddlewareVariables } from "@/lib/hono-factory";

/**
 * Get the indexing status for supported API handlers,
 * ensuring all prerequisites are met. If any prerequisites are not met,
 * an appropriate error result is returned.
 *
 * @param indexingStatusVar Indexing status variable from middleware context
 * @param requiredPlugins List of required plugins for the API handler
 * @returns The indexing status result for supported API handler.
 */
export function getIndexingStatusForSupportedApiHandler(
  indexingStatusVar: MiddlewareVariables["indexingStatus"] | undefined,
  requiredPlugins: PluginName[] = [],
): IndexingStatusForSupportedApiResult {
  if (indexingStatusVar === undefined) {
    return buildResultInternalServerError(`Invariant: indexingStatusMiddleware required.`);
  }

  const hasEnsIndexerConfigSupport =
    requiredPlugins.length === 0 ||
    requiredPlugins.every((plugin) => config.ensIndexerPublicConfig.plugins.includes(plugin));

  if (!hasEnsIndexerConfigSupport) {
    const errorMessage = [
      `This API is unavailable for this ENSNode instance.`,
      `The connected ENSIndexer did not activate all the plugins this API requires.`,
      `Active plugins: "${config.ensIndexerPublicConfig.plugins.join(", ")}".`,
      `Required plugins: "${requiredPlugins.join(", ")}".`,
    ].join(" ");

    return buildResultServiceUnavailable(errorMessage, false);
  }

  if (indexingStatusVar instanceof Error) {
    const errorMessage = [
      `This API is temporarily unavailable for this ENSNode instance.`,
      `The indexing status has not been loaded by ENSApi yet.`,
    ].join(" ");

    return buildResultServiceUnavailable(errorMessage, true);
  }

  const { snapshot } = indexingStatusVar;
  const { omnichainSnapshot, slowestChainIndexingCursor } = snapshot;

  const chains = Array.from(omnichainSnapshot.chains.values());
  const configTypeId = getOmnichainIndexingConfigTypeId(chains);

  if (!isApiHandlerSupportedByIndexingStatus(configTypeId, omnichainSnapshot.omnichainStatus)) {
    const earliestChainIndexingCursor = getTimestampForLowestOmnichainStartBlock(chains);
    const progressSufficientFromChainIndexingCursor = slowestChainIndexingCursor;

    const targetIndexingStatus = getSupportedIndexingStatusForApiHandler(configTypeId);

    const errorMessage = [
      `This API is temporarily unavailable for this ENSNode instance.`,
      `The cached omnichain indexing status of the connected ENSIndexer has insufficient progress.`,
    ].join(" ");

    return buildResultInsufficientIndexingProgress(errorMessage, {
      indexingStatus: omnichainSnapshot.omnichainStatus,
      slowestChainIndexingCursor,
      earliestChainIndexingCursor,
      progressSufficientFrom: {
        indexingStatus: targetIndexingStatus,
        chainIndexingCursor: progressSufficientFromChainIndexingCursor,
      },
    });
  }

  return buildResultOkIndexingStatusForSupportedApi({
    indexingStatus: indexingStatusVar,
  });
}
