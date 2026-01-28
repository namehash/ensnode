/**
 * This module provides a function to validate the prerequisites for API handlers.
 */
import config from "@/config";

import {
  type ApiHandlerPrerequisitesValidationResult,
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultOkApiHandlerPrerequisitesValidation,
  buildResultServiceUnavailable,
  getOmnichainIndexingConfigTypeId,
  getOmnichainIndexingStatusIdFinal,
  getTimestampForLowestOmnichainStartBlock,
  type PluginName,
} from "@ensnode/ensnode-sdk";

import type { MiddlewareVariables } from "@/lib/hono-factory";

/**
 * Validates that the indexing status meets the prerequisites for the API handler.
 *
 * If any of the prerequisites is not met, returns an appropriate error result.
 * Otherwise, returns a successful result containing the indexing status.
 *
 * @param indexingStatusVar Indexing status variable from middleware context
 * @param requiredPlugins List of required plugins for the API handler
 * @returns Prerequisite validation result
 */
export function validateApiHandlerPrerequisites(
  indexingStatusVar: MiddlewareVariables["indexingStatus"] | undefined,
  requiredPlugins: PluginName[] = [],
): ApiHandlerPrerequisitesValidationResult {
  // Fail validation if indexing status middleware was not applied
  if (indexingStatusVar === undefined) {
    return buildResultInternalServerError(`Invariant: indexingStatusMiddleware required.`);
  }

  // Fail validation if required plugins were not activated in
  // the connected ENSIndexer config
  if (requiredPlugins.length > 0) {
    const hasEnsIndexerConfigSupport = requiredPlugins.every((plugin) =>
      config.ensIndexerPublicConfig.plugins.includes(plugin),
    );

    if (!hasEnsIndexerConfigSupport) {
      const errorMessage = [
        `This API is unavailable for this ENSNode instance.`,
        `The connected ENSIndexer did not activate all the plugins this API requires.`,
        `Active plugins: "${config.ensIndexerPublicConfig.plugins.join(", ")}".`,
        `Required plugins: "${requiredPlugins.join(", ")}".`,
      ].join(" ");

      return buildResultServiceUnavailable(errorMessage, false);
    }
  }

  // Fail validation if Indexing Status has not been fetched successfully yet
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
  const targetIndexingStatus = getOmnichainIndexingStatusIdFinal(configTypeId);

  // Fail validation if Indexing Status has not reached sufficient progress
  if (omnichainSnapshot.omnichainStatus !== targetIndexingStatus) {
    const earliestChainIndexingCursor = getTimestampForLowestOmnichainStartBlock(chains);
    const progressSufficientFromChainIndexingCursor = slowestChainIndexingCursor;

    const errorMessage = [
      `This API is temporarily unavailable for this ENSNode instance.`,
      `The cached omnichain indexing status of the connected ENSIndexer has insufficient progress.`,
    ].join(" ");

    return buildResultInsufficientIndexingProgress(errorMessage, {
      currentIndexingStatus: omnichainSnapshot.omnichainStatus,
      currentIndexingCursor: slowestChainIndexingCursor,
      startIndexingCursor: earliestChainIndexingCursor,
      targetIndexingStatus,
      targetIndexingCursor: progressSufficientFromChainIndexingCursor,
    });
  }

  return buildResultOkApiHandlerPrerequisitesValidation({
    indexingStatus: indexingStatusVar,
  });
}
