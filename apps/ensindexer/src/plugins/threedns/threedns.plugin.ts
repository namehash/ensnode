import { createConfig } from "ponder";

import { default as appConfig } from "@/config/app-config";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * The ThreeDNS plugin describes indexing behavior for the ThreeDNSOptimism & ThreeDNSBase Datasources.
 */
export const pluginName = PluginName.ThreeDNS;
export const requiredDatasources = [DatasourceName.ThreeDNSOptimism, DatasourceName.ThreeDNSBase];
const { chain: optimism, contracts: optimismContracts } =
  appConfig.selectedEnsDeployment[DatasourceName.ThreeDNSOptimism];
const { chain: base, contracts: baseContracts } =
  appConfig.selectedEnsDeployment[DatasourceName.ThreeDNSBase];

const namespace = makePluginNamespace(pluginName);

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
