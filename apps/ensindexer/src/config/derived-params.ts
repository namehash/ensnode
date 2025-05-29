import { ENSIndexerConfig } from "@/config/types";
import { PLUGIN_REQUIRED_DATASOURCES } from "@/plugins";
import { getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Derive `indexedChainIds` configuration parameter and include it in
 * configuration.
 *
 * @param config partial configuration
 * @returns extended configuration
 */
export const derive_indexedChainIds = <
  CONFIG extends Pick<ENSIndexerConfig, "ensDeploymentChain" | "plugins">,
>(
  config: CONFIG,
): CONFIG & { indexedChainIds: ENSIndexerConfig["indexedChainIds"] } => {
  const indexedChainIds: number[] = [];

  const deployment = getENSDeployment(config.ensDeploymentChain);

  for (const pluginName of config.plugins) {
    const datasourceNames = PLUGIN_REQUIRED_DATASOURCES[pluginName];

    for (const datasourceName of datasourceNames) {
      const { chain } = deployment[datasourceName];

      indexedChainIds.push(chain.id);
    }
  }

  return {
    ...config,
    indexedChainIds,
  };
};

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
