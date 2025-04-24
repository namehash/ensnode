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
const { chain: root } = MERGED_ENS_DEPLOYMENT[DatasourceName.Root];
const { chain: optimism, contracts: optimismContracts } =
  MERGED_ENS_DEPLOYMENT[DatasourceName.ThreeDNSOptimism];
const { chain: base, contracts: baseContracts } =
  MERGED_ENS_DEPLOYMENT[DatasourceName.ThreeDNSBase];

const namespace = makePluginNamespace(pluginName);

export const config = createConfig({
  networks: {
    // include root so that this plugin can be run independently
    ...networksConfigForChain(root),
    ...networksConfigForChain(optimism),
    ...networksConfigForChain(base),
  },
  contracts: {
    [namespace("ThreeDNSTokenOptimism")]: {
      network: networkConfigForContract(optimism, optimismContracts.ThreeDNSToken),
      abi: optimismContracts.ThreeDNSToken.abi,
    },
    [namespace("ThreeDNSTokenBase")]: {
      network: networkConfigForContract(base, baseContracts.ThreeDNSToken),
      abi: baseContracts.ThreeDNSToken.abi,
    },
    Resolver: {
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
  // the shared Registrar handler in this plugin indexes direct subnames of '.eth'
  // TODO: no longer necessary for this plugin, bad assumption...
  registrarManagedName: "eth",
  namespace,
  handlers: [
    import("./handlers/ThreeDNSTokenOptimism"),
    import("./handlers/ThreeDNSTokenBase"),
    import("../shared/Resolver"),
  ],
});
