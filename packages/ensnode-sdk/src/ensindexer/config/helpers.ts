import { type ENSIndexerPublicConfig, PluginName } from "./types";

/**
 * Determines if the provided `config` results in indexing behavior compatible with the legacy ENS
 * Subgraph.
 *
 * @see https://ensnode.io/docs/reference/subgraph-compatibility/
 */
export function isSubgraphCompatible(
  config: Pick<ENSIndexerPublicConfig, "plugins" | "labelSet">,
): boolean {
  // 1. only the subgraph plugin is active
  const onlySubgraphPluginActivated =
    config.plugins.length === 1 && config.plugins[0] === PluginName.Subgraph;

  // 2. label set id must be "subgraph" and version must be 0
  const labelSetIsSubgraphCompatible =
    config.labelSet.labelSetId === "subgraph" && config.labelSet.labelSetVersion === 0;

  return onlySubgraphPluginActivated && labelSetIsSubgraphCompatible;
}
