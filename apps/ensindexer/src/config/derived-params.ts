import { type ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import type { ChainId } from "@ensnode/ensnode-sdk";

import type { ENSIndexerConfig } from "@/config/types";
import { getPlugin } from "@/plugins";

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

  const datasources = getENSNamespace(config.namespace) as ENSNamespace;

  for (const pluginName of config.plugins) {
    const datasourceNames = getPlugin(pluginName).requiredDatasourceNames;

    for (const datasourceName of datasourceNames) {
      const datasource = datasources[datasourceName];
      if (datasource) indexedChainIds.add(datasource.chain.id);
    }
  }

  return {
    ...config,
    indexedChainIds,
  };
};
