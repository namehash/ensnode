/**
 * The ThreeDNS plugin describes indexing behavior for 3DNSToken on both Optimism and Base.
 */

import * as ponder from "ponder";

import { DatasourceNames, ResolverABI } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfigForDatasources,
  getRequiredDatasources,
} from "@/lib/ponder-helpers";

const pluginName = PluginName.ThreeDNS;

const REQUIRED_DATASOURCE_NAMES = [DatasourceNames.ThreeDNSOptimism, DatasourceNames.ThreeDNSBase];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      threednsOptimism, //
      threednsBase,
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    return ponder.createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        REQUIRED_DATASOURCE_NAMES,
      ),
      contracts: {
        // multi-chain ThreeDNSToken indexing config
        [namespaceContract(pluginName, "ThreeDNSToken")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              threednsOptimism.chain.id,
              threednsOptimism.contracts.ThreeDNSToken,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              threednsBase.chain.id,
              threednsBase.contracts.ThreeDNSToken,
            ),
          },
          // NOTE: abi is identical in a multi-chain ponder config, just use Optimism's here
          abi: threednsOptimism.contracts.ThreeDNSToken.abi,
        },
        // multi-chain ThreeDNS-specific Resolver indexing config
        [namespaceContract(pluginName, "Resolver")]: {
          abi: ResolverABI,
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              threednsOptimism.chain.id,
              threednsOptimism.contracts.Resolver,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              threednsBase.chain.id,
              threednsBase.contracts.Resolver,
            ),
          },
        },
      },
    });
  },
});
