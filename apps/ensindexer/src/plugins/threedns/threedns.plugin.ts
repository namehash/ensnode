import { createConfig } from "ponder";

import { config } from "@/config";
import {
  ENSIndexerPlugin,
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */
const pluginName = PluginName.ThreeDNS;

/**
 * Datasources required by ThreeDNS plugin.
 */
const requiredDatasources = [DatasourceName.ThreeDNSBase, DatasourceName.ThreeDNSOptimism];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// plugin config factory function
const pluginConfig = () => {
  // extract the chain and contract configs for root Datasource in order to build ponder config
  const deployment = getENSDeployment(config().ensDeploymentChain);
  const { chain: optimism, contracts: optimismContracts } =
    deployment[DatasourceName.ThreeDNSOptimism];
  const { chain: base, contracts: baseContracts } = deployment[DatasourceName.ThreeDNSBase];

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
};

type PluginConfig = ReturnType<typeof pluginConfig>;

export default {
  /**
   * Activate the plugin handlers for indexing.
   */
  get activate(): () => Promise<void> {
    return activateHandlers({
      pluginName,
      namespace,
      handlers: [import("./handlers/ThreeDNSToken")],
    });
  },

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  get config(): PluginConfig {
    return pluginConfig();
  },

  /**
   * The plugin name, used for identification.
   */
  pluginName,

  /**
   * The plugin required datasources, used for validation.
   */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.ThreeDNS, PluginConfig>;
