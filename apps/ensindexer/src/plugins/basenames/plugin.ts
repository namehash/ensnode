/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource.
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

const pluginName = PluginName.Basenames;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.Basenames],
  createPonderConfig(ensIndexerConfig) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      ensIndexerConfig.namespace,
      DatasourceNames.Basenames,
    );

    return ponder.createConfig({
      networks: networksConfigForChain(chain.id, ensIndexerConfig.rpcConfigs),
      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.Registry,
          ),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.BaseRegistrar,
          ),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EARegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.EARegistrarController,
          ),
          abi: contracts.EARegistrarController.abi,
        },
        [namespaceContract(pluginName, "RegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.RegistrarController,
          ),
          abi: contracts.RegistrarController.abi,
        },
        // NOTE: shared Resolver definition/implementation
        Resolver: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.Resolver,
          ),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
