import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import { hasBackfillCompleted } from "../ensnode/api/prerequisites";
import type { OmnichainIndexingStatusId } from "../indexing-status";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the Omnigraph API.
 *
 * The Omnigraph API is served whenever the config indexes the ENS data model
 * (`unigraph` / `ensv2`).
 */
export function hasOmnigraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported =
    config.plugins.includes(PluginName.Unigraph) || config.plugins.includes(PluginName.ENSv2);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Config must have one of the '${PluginName.Unigraph}' or '${PluginName.ENSv2}' plugins enabled.`,
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
