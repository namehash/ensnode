import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import type { PrerequisiteResult } from "../shared/prerequisites";

/**
 * Check if provided EnsIndexerPublicConfig supports the Subgraph API.
 */
export function hasSubgraphApiConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported = config.plugins.includes(PluginName.Subgraph);
  if (supported) return { supported };

  return {
    supported: false,
    reason: `ENSNode Config must have the '${PluginName.Subgraph}' plugin enabled.`,
  };
}
