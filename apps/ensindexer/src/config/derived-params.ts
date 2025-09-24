import type { ENSIndexerConfig } from "@/config/types";
import { getENSNamespaceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { getPlugin } from "@/plugins";
import { ChainId, isSubgraphCompatible } from "@ensnode/ensnode-sdk";

/**
 * Derive `indexedChainIds` configuration parameter and include it in
 * configuration.
 *
 * @param config partial configuration
 * @returns extended configuration
 */
export const derive_indexedChainIds = <
  CONFIG extends Pick<ENSIndexerConfig, "namespace" | "plugins">,
>(
  config: CONFIG,
): CONFIG & { indexedChainIds: ENSIndexerConfig["indexedChainIds"] } => {
  const indexedChainIds = new Set<ChainId>();

  const datasources = getENSNamespaceAsFullyDefinedAtCompileTime(config.namespace);

  for (const pluginName of config.plugins) {
    const datasourceNames = getPlugin(pluginName).requiredDatasourceNames;

    for (const datasourceName of datasourceNames) {
      const { chain } = datasources[datasourceName];

      indexedChainIds.add(chain.id);
    }
  }

  return {
    ...config,
    indexedChainIds,
  };
};

/**
 * Derived `isSubgraphCompatible` config param based on validated ENSIndexerConfig object.
 */
export const derive_isSubgraphCompatible = <
  CONFIG extends Pick<ENSIndexerConfig, "plugins" | "labelSet">,
>(
  config: CONFIG,
): CONFIG & { isSubgraphCompatible: boolean } => {
  return {
    ...config,
    isSubgraphCompatible: isSubgraphCompatible(config),
  };
};
