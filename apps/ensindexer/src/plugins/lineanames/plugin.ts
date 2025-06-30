/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
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
  name: PluginName.Lineanames,
  requiredDatasourceNames: [DatasourceNames.Lineanames],
  createPonderConfig(ensIndexerConfig) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      ensIndexerConfig.namespace,
      DatasourceNames.Lineanames,
    );
    const ns = makePluginNamespace(PluginName.Lineanames);

    return ponder.createConfig({
      networks: networksConfigForChain(chain.id, ensIndexerConfig.rpcConfigs),
      contracts: {
        [ns("Registry")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.Registry,
          ),
          abi: contracts.Registry.abi,
        },
        [ns("BaseRegistrar")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.BaseRegistrar,
          ),
          abi: contracts.BaseRegistrar.abi,
        },
        [ns("EthRegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.EthRegistrarController,
          ),
          abi: contracts.EthRegistrarController.abi,
        },
        [ns("NameWrapper")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.NameWrapper,
          ),
          abi: contracts.NameWrapper.abi,
        },
        // We use a shared Subgraph-compatible Resolver ABI, hence we don't need apply any contract namespace here for the plugin
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
