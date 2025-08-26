import { type ENSIndexerPublicConfig, PluginName } from "./types";

/**
 * Determines whether the provided `config` should be run in subgraph-compatibility mode (maintains
 * backwards compatibility with the ENS Subgraph's resulting index/api).
 *
 * @see https://ensnode.io/docs/reference/subgraph-compatibility/
 */
export function isSubgraphCompatible(
  config: Pick<
    ENSIndexerPublicConfig,
    | "plugins"
    | "healReverseAddresses"
    | "indexAdditionalResolverRecords"
    | "replaceUnnormalized"
    | "labelSet"
  >,
): boolean {
  // 1. only the subgraph plugin is active
  const onlySubgraphPluginActivated =
    config.plugins.length === 1 && config.plugins[0] === PluginName.Subgraph;

  // 2. healReverseAddresses = false
  // 3. indexAdditionalResolverRecords = false
  // 4. replaceUnnormalized = false
  const indexingBehaviorIsSubgraphCompatible =
    !config.healReverseAddresses &&
    !config.indexAdditionalResolverRecords &&
    !config.replaceUnnormalized;

  // 5. label set id must be "subgraph" and version must be 0
  const labelSetIsSubgraphCompatible =
    config.labelSet.labelSetId === "subgraph" && config.labelSet.labelSetVersion === 0;

  return (
    onlySubgraphPluginActivated &&
    indexingBehaviorIsSubgraphCompatible &&
    labelSetIsSubgraphCompatible
  );
}
