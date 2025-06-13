/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */

import { definePlugin } from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default definePlugin({
  name: PluginName.ThreeDNS,
  requiredDatasources: [DatasourceName.ThreeDNSBase, DatasourceName.ThreeDNSOptimism],
  buildPonderConfig({ datasourceConfigOptions, namespace }) {
    const threeDNSBase = datasourceConfigOptions(DatasourceName.ThreeDNSBase);
    const threeDNSOptimism = datasourceConfigOptions(DatasourceName.ThreeDNSOptimism);

    return createPonderConfig({
      networks: {
        ...threeDNSOptimism.networksConfigForChain(),
        ...threeDNSBase.networksConfigForChain(),
      },
      contracts: {
        [namespace("ThreeDNSToken")]: {
          network: {
            ...threeDNSOptimism.networkConfigForContract(threeDNSOptimism.contracts.ThreeDNSToken),
            ...threeDNSBase.networkConfigForContract(threeDNSBase.contracts.ThreeDNSToken),
          },
          abi: threeDNSOptimism.contracts.ThreeDNSToken.abi,
        },
        [namespace("Resolver")]: {
          network: {
            ...threeDNSOptimism.networkConfigForContract(threeDNSOptimism.contracts.Resolver),
            ...threeDNSBase.networkConfigForContract(threeDNSBase.contracts.Resolver),
          },
          abi: threeDNSOptimism.contracts.Resolver.abi,
        },
      },
    });
  },
});
