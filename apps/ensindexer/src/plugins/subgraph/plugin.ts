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
  createPonderConfig(config) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ENSRoot,
    );

    return ponder.createConfig({
      networks: networksConfigForChain(config.rpcConfigs, chain.id),
      contracts: {
        [namespaceContract(pluginName, "RegistryOld")]: {
          network: networkConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.RegistryOld,
          ),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "Registry")]: {
          network: networkConfigForContract(config.globalBlockrange, chain.id, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          network: networkConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.BaseRegistrar,
          ),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EthRegistrarControllerOld")]: {
          network: networkConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.EthRegistrarControllerOld,
          ),
          abi: contracts.EthRegistrarControllerOld.abi,
        },
        [namespaceContract(pluginName, "EthRegistrarController")]: {
          network: networkConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.EthRegistrarController,
          ),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "NameWrapper")]: {
          network: networkConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.NameWrapper,
          ),
          abi: contracts.NameWrapper.abi,
        },
        // NOTE: shared (non-namespaced) Resolver definition/implementation (see plugins/shared/Resolver.ts)
        Resolver: {
          network: networkConfigForContract(config.globalBlockrange, chain.id, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
