/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource.
 */

import {
  buildPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  makePluginNamespace,
} from "@/lib/plugin-helpers";
import { networkConfigForContract, networksConfigForChain } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

export default buildPlugin({
  name: PluginName.Basenames,
  requiredDatasourceNames: [DatasourceNames.Basenames],
  createPonderConfig(ensIndexerConfig) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      ensIndexerConfig.namespace,
      DatasourceNames.Basenames,
    );
    const ns = makePluginNamespace(PluginName.Basenames);

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
        [ns("EARegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.EARegistrarController,
          ),
          abi: contracts.EARegistrarController.abi,
        },
        [ns("RegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            ensIndexerConfig.globalBlockrange,
            contracts.RegistrarController,
          ),
          abi: contracts.RegistrarController.abi,
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
