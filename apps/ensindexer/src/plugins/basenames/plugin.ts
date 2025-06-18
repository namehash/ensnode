/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
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

const pluginName = PluginName.Basenames;

// Define the Datasources required by the plugin
const requiredDatasources = [DatasourceName.Basenames];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPonderConfig(appConfig: ENSIndexerConfig) {
  const { ensDeployment } = appConfig;
  const { chain, contracts } = ensDeployment[DatasourceName.Basenames];

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
}

// implicitly define the type returned by createPonderConfig
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
      import("../shared/Resolver"),
    ],
  }),

  /**
   * Load the plugin configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the plugin configuration
   * is only built when the plugin is activated.
   */
  createPonderConfig,

  /** The unique plugin name */
  pluginName,

  /** The plugin's required Datasources */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.Basenames, PonderConfig>;
