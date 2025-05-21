import { createConfig } from "ponder";

import { default as appConfig } from "@/config/app-config";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

// contruct a unique contract namespace for this plugin
export const pluginName = PluginName.ThreeDNS;
const namespace = makePluginNamespace(pluginName);

const deployment = getENSDeployment(appConfig.ensDeploymentChain);
const { chain: optimism, contracts: optimismContracts } =
  deployment[DatasourceName.ThreeDNSOptimism];
const { chain: base, contracts: baseContracts } = deployment[DatasourceName.ThreeDNSBase];

export const config = createConfig({
  networks: {
    ...networksConfigForChain(appConfig, optimism.id),
    ...networksConfigForChain(appConfig, base.id),
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
