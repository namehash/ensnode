import type { ENSIndexerConfig } from "@/config/types";
import {
  type ENSIndexerPlugin,
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig } from "ponder";

/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */
const pluginName = PluginName.ThreeDNS;

// enlist datasources used within createPluginConfig function
// useful for config validation
const requiredDatasources = [DatasourceName.ThreeDNSOptimism, DatasourceName.ThreeDNSBase];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPluginConfig(appConfig: ENSIndexerConfig) {
  const { ensDeployment } = appConfig;
  // extract the chain and contract configs for root Datasource in order to build ponder config
  const { chain: optimism, contracts: optimismContracts } =
    ensDeployment[DatasourceName.ThreeDNSOptimism];
  const { chain: base, contracts: baseContracts } = ensDeployment[DatasourceName.ThreeDNSBase];

  return createConfig({
    networks: {
      ...networksConfigForChain(optimism.id),
      ...networksConfigForChain(base.id),
    },
    contracts: {
      [namespace("ThreeDNSToken")]: {
        network: {
          ...networkConfigForContract(optimism, optimismContracts.ThreeDNSToken),
          ...networkConfigForContract(base, baseContracts.ThreeDNSToken),
        },
        abi: optimismContracts.ThreeDNSToken.abi,
      },
      [namespace("Resolver")]: {
        network: {
          ...networkConfigForContract(optimism, optimismContracts.Resolver),
          ...networkConfigForContract(base, baseContracts.Resolver),
        },
        abi: optimismContracts.Resolver.abi,
      },
    },
  });
}

// construct a specific type for plugin configuration
type PluginConfig = ReturnType<typeof createPluginConfig>;

const threednsPlugin = {
  /**
   * Activate the plugin handlers for indexing.
   */
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: () => [import("./handlers/ThreeDNSToken")],
  }),

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  createPluginConfig,

  /** The plugin name, used for identification */
  pluginName,

  /** A list of required datasources for the plugin */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.ThreeDNS, PluginConfig>;

export default threednsPlugin;
