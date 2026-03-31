import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the ENSNode Omnigraph API.
 */
export function hasOmnigraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported = config.plugins.includes(PluginName.ENSv2);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Config must have the '${PluginName.ENSv2}' plugin enabled.`,
  };
}
