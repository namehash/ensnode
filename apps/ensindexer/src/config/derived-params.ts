import type { Chain } from "viem";

import type { ChainId } from "@ensnode/ensnode-sdk";

import type { EnsIndexerConfig } from "@/config/types";
import { getPlugin } from "@/plugins";

/**
 * Derive `indexedChainIds` configuration parameter and include it in configuration.
 *
 * @param config partial configuration
 * @returns extended configuration
 */
export const derive_indexedChainIds = <CONFIG extends Omit<EnsIndexerConfig, "indexedChainIds">>(
  config: CONFIG,
): CONFIG & { indexedChainIds: EnsIndexerConfig["indexedChainIds"] } => {
  const indexedChainIds = new Set<ChainId>();

  const plugins = config.plugins.map(getPlugin);
  for (const plugin of plugins) {
    const ponderConfig = plugin.createPonderConfig(config);
    for (const chain of Object.values(ponderConfig.chains) as Chain[]) {
      indexedChainIds.add(chain.id);
    }
  }

  return {
    ...config,
    indexedChainIds,
  };
};
