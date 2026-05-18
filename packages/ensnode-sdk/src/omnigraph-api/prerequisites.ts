import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import { hasBackfillCompleted } from "../ensnode/api/prerequisites";
import type { OmnichainIndexingStatusId } from "../indexing-status";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the Omnigraph API.
 */
export function hasOmnigraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported =
    config.plugins.includes(PluginName.Unigraph) || config.plugins.includes(PluginName.ENSv2);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Config must have the '${PluginName.Unigraph}' plugin enabled.`,
  };
}

/**
 * Check if provided OmnichainIndexingStatusId supports the Omnigraph API.
 */
export function hasOmnigraphApiIndexingStatusSupport(
  indexingStatus: OmnichainIndexingStatusId,
): PrerequisiteResult {
  return hasBackfillCompleted(indexingStatus);
}
