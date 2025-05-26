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
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */
const pluginName = PluginName.ThreeDNS;

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

export const plugin = {
  pluginName,
  get config() {
    // extract the chain and contract configs for root Datasource in order to build ponder config
    const deployment = getENSDeployment(config.ensDeploymentChain);

    const { chain: optimism, contracts: optimismContracts } =
      deployment[DatasourceName.ThreeDNSOptimism];
    const { chain: base, contracts: baseContracts } = deployment[DatasourceName.ThreeDNSBase];

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
  },
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: [import("./handlers/ThreeDNSToken")],
  }),
} as const satisfies ENSIndexerPlugin<PluginName.ThreeDNS>;
