/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  makePluginNamespace,
} from "@/lib/plugin-helpers";
import { networkConfigForContract, networksConfigForChain } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

export default createPlugin({
  name: PluginName.ThreeDNS,
  requiredDatasourceNames: [DatasourceNames.ThreeDNSBase, DatasourceNames.ThreeDNSOptimism],
  createPonderConfig(ensIndexerConfig) {
    const threeDNSBase = getDatasourceAsFullyDefinedAtCompileTime(
      ensIndexerConfig.namespace,
      DatasourceNames.ThreeDNSBase,
    );
    const threeDNSOptimism = getDatasourceAsFullyDefinedAtCompileTime(
      ensIndexerConfig.namespace,
      DatasourceNames.ThreeDNSOptimism,
    );
    const ns = makePluginNamespace(PluginName.ThreeDNS);

    // ABI for the ThreeDNSToken contract is the same on both chains, so we can use one.
    const threeDNSTokenAbi = threeDNSOptimism.contracts.ThreeDNSToken.abi;
    // ABI for the Resolver contract is the same on both chains, so we can use one.
    const resolverAbi = threeDNSOptimism.contracts.Resolver.abi;

    return ponder.createConfig({
      networks: {
        ...networksConfigForChain(threeDNSOptimism.chain.id, ensIndexerConfig.rpcConfigs),
        ...networksConfigForChain(threeDNSBase.chain.id, ensIndexerConfig.rpcConfigs),
      },
      contracts: {
        [ns("ThreeDNSToken")]: {
          network: {
            ...networkConfigForContract(
              threeDNSOptimism.chain.id,
              ensIndexerConfig.globalBlockrange,
              threeDNSOptimism.contracts.ThreeDNSToken,
            ),
            ...networkConfigForContract(
              threeDNSBase.chain.id,
              ensIndexerConfig.globalBlockrange,
              threeDNSBase.contracts.ThreeDNSToken,
            ),
          },
          abi: threeDNSTokenAbi,
        },
        [ns("Resolver")]: {
          network: {
            ...networkConfigForContract(
              threeDNSOptimism.chain.id,
              ensIndexerConfig.globalBlockrange,
              threeDNSOptimism.contracts.Resolver,
            ),
            ...networkConfigForContract(
              threeDNSBase.chain.id,
              ensIndexerConfig.globalBlockrange,
              threeDNSBase.contracts.Resolver,
            ),
          },
          abi: resolverAbi,
        },
      },
    });
  },
});
