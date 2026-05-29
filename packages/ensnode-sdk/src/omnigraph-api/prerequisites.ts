import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import { hasBackfillCompleted } from "../ensnode/api/prerequisites";
import type { OmnichainIndexingStatusId } from "../indexing-status";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the Omnigraph API.
 *
 * The Omnigraph API is served whenever the config indexes data it can expose: the ENS data model
 * (`unigraph` / `ensv2`) or the highly-ENS-adjacent EFP protocol (`efp`). EFP qualifies on its own
 * so an EFP-only config can still query the `efp` namespace (the ENS query fields are present but
 * return no data without `unigraph`).
 */
export function hasOmnigraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported =
    config.plugins.includes(PluginName.Unigraph) ||
    config.plugins.includes(PluginName.ENSv2) ||
    config.plugins.includes(PluginName.EFP);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Config must have one of the '${PluginName.Unigraph}', '${PluginName.ENSv2}', or '${PluginName.EFP}' plugins enabled.`,
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
