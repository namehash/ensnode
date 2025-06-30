/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { networkConfigForContract, networksConfigForChain } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

const pluginName = PluginName.ThreeDNS;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.ThreeDNSBase, DatasourceNames.ThreeDNSOptimism],
  createPonderConfig(config) {
    const threeDNSBase = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSBase,
    );
    const threeDNSOptimism = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSOptimism,
    );

    // ABI for the ThreeDNSToken contract is the same on both chains, so we can use one.
    const threeDNSTokenAbi = threeDNSOptimism.contracts.ThreeDNSToken.abi;
    // ABI for the Resolver contract is the same on both chains, so we can use one.
    const resolverAbi = threeDNSOptimism.contracts.Resolver.abi;

    return ponder.createConfig({
      networks: {
        ...networksConfigForChain(config, threeDNSOptimism.chain.id),
        ...networksConfigForChain(config, threeDNSBase.chain.id),
      },
      contracts: {
        [namespaceContract(pluginName, "ThreeDNSToken")]: {
          network: {
            ...networkConfigForContract(
              threeDNSOptimism.chain.id,
              config.globalBlockrange,
              threeDNSOptimism.contracts.ThreeDNSToken,
            ),
            ...networkConfigForContract(
              threeDNSBase.chain.id,
              config.globalBlockrange,
              threeDNSBase.contracts.ThreeDNSToken,
            ),
          },
          abi: threeDNSTokenAbi,
        },
        // NOTE: ThreeDNS-specific Resolver definition/implementation
        [namespaceContract(pluginName, "Resolver")]: {
          network: {
            ...networkConfigForContract(
              threeDNSOptimism.chain.id,
              config.globalBlockrange,
              threeDNSOptimism.contracts.Resolver,
            ),
            ...networkConfigForContract(
              threeDNSBase.chain.id,
              config.globalBlockrange,
              threeDNSBase.contracts.Resolver,
            ),
          },
          abi: resolverAbi,
        },
      },
    });
  },
});
