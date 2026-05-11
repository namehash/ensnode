import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import {
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "../indexing-status";
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
 * Check if provided OmnichainIndexingStatusSnapshot supports the Subgraph API.
 */
export function hasSubgraphApiIndexingStatusSupport(
  config: OmnichainIndexingStatusSnapshot,
): PrerequisiteResult {
  const supported =
    config.omnichainStatus === OmnichainIndexingStatusIds.Completed ||
    config.omnichainStatus === OmnichainIndexingStatusIds.Following;

  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Omnichain Indexing Status must be "${OmnichainIndexingStatusIds.Completed}" or "${OmnichainIndexingStatusIds.Following}" for the Subgraph API to be available. Current omnichain indexing status is "${config.omnichainStatus}".`,
  };
}
