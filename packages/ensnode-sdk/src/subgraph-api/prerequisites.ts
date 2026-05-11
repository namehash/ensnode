import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import { type OmnichainIndexingStatusId, OmnichainIndexingStatusIds } from "../indexing-status";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the Subgraph API.
 */
export function hasSubgraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported = config.plugins.includes(PluginName.Subgraph);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Config must have the '${PluginName.Subgraph}' plugin enabled.`,
  };
}

/**
 * Check if provided OmnichainIndexingStatusId supports the Subgraph API.
 */
export function hasSubgraphApiIndexingStatusSupport(
  indexingStatus: OmnichainIndexingStatusId,
): PrerequisiteResult {
  const supported =
    indexingStatus === OmnichainIndexingStatusIds.Completed ||
    indexingStatus === OmnichainIndexingStatusIds.Following;

  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Omnichain Indexing Status must be "${OmnichainIndexingStatusIds.Completed}" or "${OmnichainIndexingStatusIds.Following}" for the Subgraph API to be available. Current omnichain indexing status is "${indexingStatus}".`,
  };
}
