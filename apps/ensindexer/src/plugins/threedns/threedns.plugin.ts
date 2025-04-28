import { createConfig } from "ponder";

import { MERGED_ENS_DEPLOYMENT } from "@/lib/globals";
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

// extract the chain and contract configs for root Datasource in order to build ponder config
const { chain: optimism, contracts: optimismContracts } =
  MERGED_ENS_DEPLOYMENT[DatasourceName.ThreeDNSOptimism];
const { chain: base, contracts: baseContracts } =
  MERGED_ENS_DEPLOYMENT[DatasourceName.ThreeDNSBase];

const namespace = makePluginNamespace(pluginName);

export const config = createConfig({
  networks: {
    ...networksConfigForChain(optimism),
    ...networksConfigForChain(base),
  },
  contracts: {
    [namespace("ThreeDNSToken")]: {
      network: {
        ...networkConfigForContract(optimism, optimismContracts.ThreeDNSToken),
        ...networkConfigForContract(base, baseContracts.ThreeDNSToken),
      },
      abi: optimismContracts.ThreeDNSToken.abi,
    },
    [namespace("ThreeDNSResolver")]: {
      network: {
        ...networkConfigForContract(optimism, optimismContracts.ThreeDNSResolver),
        ...networkConfigForContract(base, baseContracts.ThreeDNSResolver),
      },
      abi: optimismContracts.ThreeDNSResolver.abi,
    },
  },
});

export const activate = activateHandlers({
  pluginName,
  // the shared Registrar handler in this plugin indexes direct subnames of '.eth'
  // TODO: no longer necessary for this plugin, bad assumption...
  registrarManagedName: "eth",
  namespace,
  handlers: [import("./handlers/ThreeDNSToken")],
});
