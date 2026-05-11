import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import {
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "../indexing-status";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the Omnigraph API.
 */
export function hasOmnigraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported = config.plugins.includes(PluginName.ENSv2);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Config must have the '${PluginName.ENSv2}' plugin enabled.`,
  };
}

/**
 * Check if provided OmnichainIndexingStatusSnapshot supports the Omnigraph API.
 */
export function hasOmnigraphApiIndexingStatusSupport(
  config: OmnichainIndexingStatusSnapshot,
): PrerequisiteResult {
  const supported =
    config.omnichainStatus === OmnichainIndexingStatusIds.Completed ||
    config.omnichainStatus === OmnichainIndexingStatusIds.Following;

  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Omnichain Indexing Status must be "${OmnichainIndexingStatusIds.Completed}" or "${OmnichainIndexingStatusIds.Following}" for the Omnigraph API to be available. Current omnichain indexing status is "${config.omnichainStatus}".`,
  };
}
