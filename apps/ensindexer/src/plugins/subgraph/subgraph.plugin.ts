import { createConfig } from "ponder";

import { default as appConfig } from "@/config";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * The Subgraph plugin describes indexing behavior for the 'Root' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
 */
const pluginName = PluginName.Subgraph;

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

export default {
  /**
   * Activate the plugin handlers for indexing.
   */
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: [
      import("./handlers/Registry"),
      import("./handlers/Registrar"),
      import("./handlers/NameWrapper"),
      import("../shared/Resolver"),
    ],
  }),

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  get config() {
    // extract the chain and contract configs for root Datasource in order to build ponder config
    const deployment = getENSDeployment(appConfig.ensDeploymentChain);
    const { chain, contracts } = deployment[DatasourceName.Root];

    return createConfig({
      networks: networksConfigForChain(chain.id),
      contracts: {
        [namespace("RegistryOld")]: {
          network: networkConfigForContract(chain, contracts.RegistryOld),
          abi: contracts.Registry.abi,
        },
        [namespace("Registry")]: {
          network: networkConfigForContract(chain, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespace("BaseRegistrar")]: {
          network: networkConfigForContract(chain, contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespace("EthRegistrarControllerOld")]: {
          network: networkConfigForContract(chain, contracts.EthRegistrarControllerOld),
          abi: contracts.EthRegistrarControllerOld.abi,
        },
        [namespace("EthRegistrarController")]: {
          network: networkConfigForContract(chain, contracts.EthRegistrarController),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespace("NameWrapper")]: {
          network: networkConfigForContract(chain, contracts.NameWrapper),
          abi: contracts.NameWrapper.abi,
        },
        Resolver: {
          network: networkConfigForContract(chain, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },

  /**
   * The plugin name, used for identification.
   */
  pluginName,
};
