import { ENSIndexerConfig } from "@/config/types";
import { PLUGIN_REQUIRED_DATASOURCES } from "@/plugins";
import { getENSDeployment } from "@ensnode/ens-deployments";

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
