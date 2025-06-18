/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
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

const pluginName = PluginName.ThreeDNS;

// enlist datasources used within createPonderConfig function
// useful for config validation
const requiredDatasources = [DatasourceName.ThreeDNSOptimism, DatasourceName.ThreeDNSBase];

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

// config object factory used to derive PluginConfig type
function createPonderConfig(appConfig: ENSIndexerConfig) {
  const { ensDeployment } = appConfig;
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
    handlers: () => [import("./handlers/ThreeDNSToken")],
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
} as const satisfies ENSIndexerPlugin<PluginName.ThreeDNS, PonderConfig>;
