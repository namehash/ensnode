import type { ChainId } from "enssdk";

import { maybeGetDatasource } from "@ensnode/datasources";

import type { EnsIndexerConfig } from "@/config/types";
import { getPlugin } from "@/plugins";

/**
 * Derive `indexedChainIds` configuration parameter and include it in configuration.
 *
 * Iterates each active plugin's `allDatasourceNames`, resolves each against the
 * configured namespace, and collects the chain IDs of datasources that exist.
 *
 * @param config partial configuration (without indexedChainIds)
 * @returns extended configuration with indexedChainIds
 */
export const derive_indexedChainIds = <CONFIG extends Omit<EnsIndexerConfig, "indexedChainIds">>(
  config: CONFIG,
): CONFIG & { indexedChainIds: EnsIndexerConfig["indexedChainIds"] } => {
  const indexedChainIds = new Set<ChainId>();

  const plugins = config.plugins.map(getPlugin);
  for (const plugin of plugins) {
    for (const datasourceName of plugin.allDatasourceNames) {
      const datasource = maybeGetDatasource(config.namespace, datasourceName);
      if (datasource) indexedChainIds.add(datasource.chain.id);
    }
  }

  return { ...config, indexedChainIds };
};
