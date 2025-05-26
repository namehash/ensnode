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
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
const pluginName = PluginName.Basenames;

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
      import("../shared/Resolver"),
    ],
  }),

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  get config() {
    // extract the chain and contract configs for Basenames Datasource in order to build ponder config
    const deployment = getENSDeployment(appConfig.ensDeploymentChain);
    const { chain, contracts } = deployment[DatasourceName.Basenames];

    return createConfig({
      networks: networksConfigForChain(chain.id),
      contracts: {
        [namespace("Registry")]: {
          network: networkConfigForContract(chain, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespace("BaseRegistrar")]: {
          network: networkConfigForContract(chain, contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespace("EARegistrarController")]: {
          network: networkConfigForContract(chain, contracts.EARegistrarController),
          abi: contracts.EARegistrarController.abi,
        },
        [namespace("RegistrarController")]: {
          network: networkConfigForContract(chain, contracts.RegistrarController),
          abi: contracts.RegistrarController.abi,
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
