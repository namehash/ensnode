/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

const pluginName = PluginName.Lineanames;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.Lineanames],
  createPonderConfig(config) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Lineanames,
    );

    return ponder.createConfig({
      chains: chainsConnectionConfig(config.rpcConfigs, chain.id),
      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.EthRegistrarController,
          ),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "NameWrapper")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.NameWrapper),
          abi: contracts.NameWrapper.abi,
        },
        // NOTE: shared (non-namespaced) Resolver definition/implementation (see plugins/shared/Resolver.ts)
        Resolver: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
