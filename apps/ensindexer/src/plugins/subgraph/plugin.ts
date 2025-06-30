/**
 * The Subgraph plugin describes indexing behavior for the 'ENSRoot' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
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

const pluginName = PluginName.Subgraph;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.ENSRoot],
  createPonderConfig(ensIndexerConfig) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      ensIndexerConfig.namespace,
      DatasourceNames.ENSRoot,
    );

    return ponder.createConfig({
      networks: networksConfigForChain(chain.id, ensIndexerConfig.rpcConfigs),
      contracts: {
        [namespaceContract(pluginName, "RegistryOld")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.RegistryOld,
          ),
          abi: contracts.Registry.abi,
        },
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
        [namespaceContract(pluginName, "EthRegistrarControllerOld")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.EthRegistrarControllerOld,
          ),
          abi: contracts.EthRegistrarControllerOld.abi,
        },
        [namespaceContract(pluginName, "EthRegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.EthRegistrarController,
          ),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "NameWrapper")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.NameWrapper,
          ),
          abi: contracts.NameWrapper.abi,
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
