/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */
import { DatasourceName } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig } from "ponder";

import type { ENSIndexerConfig } from "@/config/types";
import {
  type ENSIndexerPlugin,
  activateHandlers,
  getDatasourceAsFullyDefinedAtCompileTime,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";

const pluginName = PluginName.ThreeDNS;

// enlist datasources used within createPonderConfig function
// useful for config validation
const requiredDatasources = [DatasourceName.ThreeDNSOptimism, DatasourceName.ThreeDNSBase];

// construct a unique contract namespace for this plugin
const pluginNamespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPonderConfig(config: ENSIndexerConfig) {
  const { chain: optimism, contracts: optimismContracts } =
    getDatasourceAsFullyDefinedAtCompileTime(config.namespace, DatasourceName.ThreeDNSOptimism);

  const { chain: base, contracts: baseContracts } = getDatasourceAsFullyDefinedAtCompileTime(
    config.namespace,
    DatasourceName.ThreeDNSBase,
  );

  return createConfig({
    networks: {
      ...networksConfigForChain(config, optimism.id),
      ...networksConfigForChain(config, base.id),
    },
    contracts: {
      [pluginNamespace("ThreeDNSToken")]: {
        network: {
          ...networkConfigForContract(config, optimism, optimismContracts.ThreeDNSToken),
          ...networkConfigForContract(config, base, baseContracts.ThreeDNSToken),
        },
        abi: optimismContracts.ThreeDNSToken.abi,
      },
      [pluginNamespace("Resolver")]: {
        network: {
          ...networkConfigForContract(config, optimism, optimismContracts.Resolver),
          ...networkConfigForContract(config, base, baseContracts.Resolver),
        },
        abi: optimismContracts.Resolver.abi,
      },
    },
  });
}

// construct a specific type for plugin configuration
type PonderConfig = ReturnType<typeof createPonderConfig>;

export default {
  /**
   * Activate the plugin handlers for indexing.
   */
  activate: activateHandlers({
    pluginName,
    pluginNamespace: pluginNamespace,
    handlers: () => [import("./handlers/ThreeDNSToken")],
  }),

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  createPonderConfig,

  /** The plugin name, used for identification */
  pluginName,

  /** A list of required datasources for the plugin */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.ThreeDNS, PonderConfig>;
