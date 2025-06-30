/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
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
      networks: networksConfigForChain(config, chain.id),
      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          network: networkConfigForContract(chain.id, config.globalBlockrange, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          network: networkConfigForContract(
            chain.id,
            config.globalBlockrange,
            contracts.BaseRegistrar,
          ),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EthRegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            config.globalBlockrange,
            contracts.EthRegistrarController,
          ),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "NameWrapper")]: {
          network: networkConfigForContract(
            chain.id,
            config.globalBlockrange,
            contracts.NameWrapper,
          ),
          abi: contracts.NameWrapper.abi,
        },
        // NOTE: shared Resolver definition/implementation
        Resolver: {
          network: networkConfigForContract(chain.id, config.globalBlockrange, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
