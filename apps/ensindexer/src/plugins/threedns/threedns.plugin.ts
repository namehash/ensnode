import { createConfig } from "ponder";

import appConfig from "@/config";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */
const pluginName = PluginName.ThreeDNS;

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

const threednsPlugin = {
  /**
   * Activate the plugin handlers for indexing.
   */
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: [import("./handlers/ThreeDNSToken")],
  }),

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  get config() {
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
  },

  /**
   * The plugin name, used for identification.
   */
  pluginName,
};

export default threednsPlugin;
