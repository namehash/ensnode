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
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */
export const pluginName = PluginName.ThreeDNS;

// contruct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

const deployment = getENSDeployment(appConfig.ensDeploymentChain);
const { chain: optimism, contracts: optimismContracts } =
  deployment[DatasourceName.ThreeDNSOptimism];
const { chain: base, contracts: baseContracts } = deployment[DatasourceName.ThreeDNSBase];

export const config = createConfig({
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

export const activate = activateHandlers({
  pluginName,
  namespace,
  handlers: [import("./handlers/ThreeDNSToken")],
});
