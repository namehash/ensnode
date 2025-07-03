/**
 * The EFP plugin describes indexing behavior for the Ethereum Follow Protocol.
 *
 * NOTE: this is an early version of an experimental EFP plugin and is not complete or production ready.
 */

import type { ENSIndexerConfig } from "@/config/types";
import {
  type ENSIndexerPlugin,
  activateHandlers,
  getDatasourceAsFullyDefinedAtCompileTime,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig } from "ponder";

const pluginName = PluginName.EFP;

// Define the DatasourceNames for Datasources required by the plugin
const requiredDatasources = [DatasourceNames.EFPRoot];

// Construct a unique plugin namespace to wrap contract names
const pluginNamespace = makePluginNamespace(pluginName);

// config object factory used to derive PonderConfig type
function createPonderConfig(config: ENSIndexerConfig) {
  const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
    config.namespace,
    DatasourceNames.EFPRoot,
  );

  return createConfig({
    networks: networksConfigForChain(config, chain.id),
    contracts: {
      [pluginNamespace("EFPListRegistry")]: {
        network: networkConfigForContract(config, chain, contracts.EFPListRegistry),
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
    pluginNamespace,
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
