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
  requiredDatasourceNames: [DatasourceNames.ThreeDNSOptimism, DatasourceNames.ThreeDNSBase],
  createPonderConfig(config) {
    const threeDNSOptimism = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSOptimism,
    );
    const threeDNSBase = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSBase,
    );

    return ponder.createConfig({
      networks: {
        ...networksConfigForChain(config.rpcConfigs, threeDNSOptimism.chain.id),
        ...networksConfigForChain(config.rpcConfigs, threeDNSBase.chain.id),
      },
      contracts: {
        // multi-network ThreeDNSToken indexing config
        [namespaceContract(pluginName, "ThreeDNSToken")]: {
          network: {
            ...networkConfigForContract(
              config.globalBlockrange,
              threeDNSOptimism.chain.id,
              threeDNSOptimism.contracts.ThreeDNSToken,
            ),
            ...networkConfigForContract(
              config.globalBlockrange,
              threeDNSBase.chain.id,
              threeDNSBase.contracts.ThreeDNSToken,
            ),
          },
          // NOTE: abi is identical in a multi-network ponder config, just use Optimism's here
          abi: threeDNSOptimism.contracts.ThreeDNSToken.abi,
        },
        // multi-network ThreeDNS-specific Resolver indexing config
        [namespaceContract(pluginName, "Resolver")]: {
          network: {
            ...networkConfigForContract(
              config.globalBlockrange,
              threeDNSOptimism.chain.id,
              threeDNSOptimism.contracts.Resolver,
            ),
            ...networkConfigForContract(
              config.globalBlockrange,
              threeDNSBase.chain.id,
              threeDNSBase.contracts.Resolver,
            ),
          },
          // NOTE: abi is identical in a multi-network ponder config, just use Optimism's here
          abi: threeDNSOptimism.contracts.Resolver.abi,
        },
      },
    });
  },
});
