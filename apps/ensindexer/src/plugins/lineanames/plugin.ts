/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
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

const pluginName = PluginName.Lineanames;

// Define the Datasources required by the plugin
const requiredDatasources = [DatasourceName.Lineanames];

// Construct a unique plugin namespace to wrap contract names
const pluginNamespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPonderConfig(config: ENSIndexerConfig) {
  const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
    config.namespace,
    DatasourceName.Lineanames,
  );

  return createConfig({
    networks: networksConfigForChain(config, chain.id),
    contracts: {
      [pluginNamespace("Registry")]: {
        network: networkConfigForContract(config, chain, contracts.Registry),
        abi: contracts.Registry.abi,
      },
      [pluginNamespace("BaseRegistrar")]: {
        network: networkConfigForContract(config, chain, contracts.BaseRegistrar),
        abi: contracts.BaseRegistrar.abi,
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

// Implicitly define the type returned by createPonderConfig
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
   * Create the ponder configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the ponder configuration
   * is only created for this plugin when it is activated.
   */
  createPonderConfig,

  /** The unique plugin name  */
  pluginName,

  /** The plugin's required Datasources */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.Lineanames, PonderConfig>;
