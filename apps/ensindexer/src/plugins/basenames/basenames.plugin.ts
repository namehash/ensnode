import { createConfig } from "ponder";

import config from "@/config";
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
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
const pluginName = PluginName.Basenames;

/**
 * Datasources required by Basenames plugin.
 */
const requiredDatasources = [DatasourceName.Basenames];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// plugin config factory function
const pluginConfig = () => {
  // extract the chain and contract configs for Basenames Datasource in order to build ponder config
  const deployment = getENSDeployment(config.ensDeploymentChain);
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
      handlers: [
        import("./handlers/Registry"),
        import("./handlers/Registrar"),
        import("../shared/Resolver"),
      ],
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
} as const satisfies ENSIndexerPlugin<PluginName.Basenames, PluginConfig>;
