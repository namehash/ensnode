/**
 * The Subgraph plugin describes indexing behavior for the 'Root' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
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

const pluginName = PluginName.Subgraph;

// enlist datasources used within createPonderConfig function
// useful for config validation
const requiredDatasources = [DatasourceName.ENSRoot];

// construct a unique contract namespace for this plugin
const pluginNamespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPonderConfig(config: ENSIndexerConfig) {
  const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
    config.namespace,
    DatasourceName.ENSRoot,
  );

  return createConfig({
    networks: networksConfigForChain(config, chain.id),
    contracts: {
      [pluginNamespace("RegistryOld")]: {
        network: networkConfigForContract(config, chain, contracts.RegistryOld),
        abi: contracts.Registry.abi,
      },
      [pluginNamespace("Registry")]: {
        network: networkConfigForContract(config, chain, contracts.Registry),
        abi: contracts.Registry.abi,
      },
      [pluginNamespace("BaseRegistrar")]: {
        network: networkConfigForContract(config, chain, contracts.BaseRegistrar),
        abi: contracts.BaseRegistrar.abi,
      },
      [pluginNamespace("EthRegistrarControllerOld")]: {
        network: networkConfigForContract(config, chain, contracts.EthRegistrarControllerOld),
        abi: contracts.EthRegistrarControllerOld.abi,
      },
      [pluginNamespace("EthRegistrarController")]: {
        network: networkConfigForContract(config, chain, contracts.EthRegistrarController),
        abi: contracts.EthRegistrarController.abi,
      },
      [pluginNamespace("NameWrapper")]: {
        network: networkConfigForContract(config, chain, contracts.NameWrapper),
        abi: contracts.NameWrapper.abi,
      },
      Resolver: {
        network: networkConfigForContract(config, chain, contracts.Resolver),
        abi: contracts.Resolver.abi,
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
    pluginNamespace,
    handlers: () => [
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
  createPonderConfig,

  /** The plugin name, used for identification */
  pluginName,

  /** A list of required datasources for the plugin */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.Subgraph, PonderConfig>;
