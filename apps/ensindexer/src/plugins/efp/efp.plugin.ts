/**
 * The EFP plugin describes indexing behavior for the Ethereum Follow Protocol.
 *
 * NOTE: this is an early version of the experimental EFP plugin and is not complete or production ready.
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

const pluginName = PluginName.EFP;

// Define the Datasources required by the plugin
const requiredDatasources = [DatasourceName.EFPRoot];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// config object factory used to derive PonderConfig type
function createPonderConfig(appConfig: ENSIndexerConfig) {
  const { ensDeployment } = appConfig;
  // extract the chain and contract configs for the EFP root Datasource in order to build ponder config
  const { chain, contracts } = ensDeployment[DatasourceName.EFPRoot];

  return createConfig({
    networks: networksConfigForChain(chain.id),
    contracts: {
      [namespace("EFPListRegistry")]: {
        network: networkConfigForContract(chain, contracts.EFPListRegistry),
        abi: contracts.EFPListRegistry.abi,
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
    namespace,
    handlers: () => [import("./handlers/EFPListRegistry")],
  }),

  /**
   * Create the ponder configuration lazily to prevent premature execution of
   * nested factory functions, i.e. to ensure that the ponder configuration
   * is only created for this plugin when it is activated.
   */
  createPonderConfig,

  /** The unique plugin name */
  pluginName,

  /** The plugin's required Datasources */
  requiredDatasources,
} as const satisfies ENSIndexerPlugin<PluginName.EFP, PonderConfig>;
