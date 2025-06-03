/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
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

const pluginName = PluginName.Lineanames;

// enlist datasources used within createPonderConfig function
// useful for config validation
const requiredDatasources = [DatasourceName.Lineanames];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPonderConfig(appConfig: ENSIndexerConfig) {
  const { ensDeployment } = appConfig;
  // extract the chain and contract configs for Lineanames Datasource in order to build ponder config
  const { chain, contracts } = ensDeployment[DatasourceName.Lineanames];

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
}

// construct a specific type for plugin configuration
type PonderConfig = ReturnType<typeof createPonderConfig>;

export default {
  /**
   * Activate the plugin handlers for indexing.
   */
  activate: activateHandlers({
    pluginName,
    namespace,
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
} as const satisfies ENSIndexerPlugin<PluginName.Lineanames, PonderConfig>;
