/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */

import { buildPlugin } from "@/lib/plugin-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default buildPlugin({
  name: PluginName.ThreeDNS,
  requiredDatasources: [DatasourceNames.ThreeDNSBase, DatasourceNames.ThreeDNSOptimism],
  buildPonderConfig({ datasourceConfigOptions, pluginNamespace: ns }) {
    const threeDNSBase = datasourceConfigOptions(DatasourceNames.ThreeDNSBase);
    const threeDNSOptimism = datasourceConfigOptions(DatasourceNames.ThreeDNSOptimism);

    return createPonderConfig({
      networks: {
        ...threeDNSOptimism.networks,
        ...threeDNSBase.networks,
      },
      contracts: {
        [ns("ThreeDNSToken")]: {
          network: {
            ...threeDNSOptimism.getContractNetwork(threeDNSOptimism.contracts.ThreeDNSToken),
            ...threeDNSBase.getContractNetwork(threeDNSBase.contracts.ThreeDNSToken),
          },
          abi: threeDNSOptimism.contracts.ThreeDNSToken.abi,
        },
        [ns("Resolver")]: {
          network: {
            ...threeDNSOptimism.getContractNetwork(threeDNSOptimism.contracts.Resolver),
            ...threeDNSBase.getContractNetwork(threeDNSBase.contracts.Resolver),
          },
          abi: threeDNSOptimism.contracts.Resolver.abi,
        },
      },
    });
  },
});
