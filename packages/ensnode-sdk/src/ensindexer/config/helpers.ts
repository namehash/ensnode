import { type ENSIndexerPublicConfig, PluginName } from "./types";

/**
 * Subgraph compatibility
 *
 * Tells if indexer config guarantees data to be indexed while
 * maintaining full subgraph-compatibility.
 */
export function isSubgraphCompatible(
  config: Pick<
    ENSIndexerPublicConfig,
    "plugins" | "healReverseAddresses" | "indexAdditionalResolverRecords"
  >,
): boolean {
  // 1. only the subgraph plugin is active
  const onlySubgraphPluginActivated =
    config.plugins.length === 1 && config.plugins[0] === PluginName.Subgraph;

  // 2. healReverseAddresses = false
  // 3. indexAdditionalResolverRecords = false
  const indexingBehaviorIsSubgraphCompatible =
    !config.healReverseAddresses && !config.indexAdditionalResolverRecords;

  return onlySubgraphPluginActivated && indexingBehaviorIsSubgraphCompatible;
}
