import type { ENSIndexerConfig } from "@/config/types";
import { type CommonDatasourcesType, getCommonDatasources } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Derived `isSubgraphCompatible` config param based on validated ENSIndexerConfig object.
 */
export const derive_isSubgraphCompatible = <
  CONFIG extends Pick<
    ENSIndexerConfig,
    "plugins" | "healReverseAddresses" | "indexAdditionalResolverRecords"
  >,
>(
  config: CONFIG,
): CONFIG & { isSubgraphCompatible: boolean } => {
  // 1. only the subgraph plugin is active
  const onlySubgraphPluginActivated =
    config.plugins.length === 1 && config.plugins[0] === PluginName.Subgraph;

  // 2. healReverseAddresses = false
  // 3. indexAdditionalResolverRecords = false
  const indexingBehaviorIsSubgraphCompatible =
    !config.healReverseAddresses && !config.indexAdditionalResolverRecords;

  return {
    ...config,
    isSubgraphCompatible: onlySubgraphPluginActivated && indexingBehaviorIsSubgraphCompatible,
  };
};

/**
 * Derived `datasources` config param based on validated ENSIndexerConfig object.
 */
export const derive_datasources = <CONFIG extends Pick<ENSIndexerConfig, "namespace">>(
  config: CONFIG,
): CONFIG & { datasources: CommonDatasourcesType } => {
  const datasources = getCommonDatasources(config.namespace);

  return { ...config, datasources };
};
