/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */

import { buildPlugin } from "@/lib/plugin-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default buildPlugin({
  name: PluginName.Lineanames,
  requiredDatasources: [DatasourceNames.Lineanames],
  buildPonderConfig({ datasourceConfigOptions, pluginNamespace: ns }) {
    const { contracts, networks, getContractNetwork } = datasourceConfigOptions(
      DatasourceNames.Lineanames,
    );

    return createPonderConfig({
      networks,
      contracts: {
        [ns("Registry")]: {
          network: getContractNetwork(contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [ns("BaseRegistrar")]: {
          network: getContractNetwork(contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [ns("EthRegistrarController")]: {
          network: getContractNetwork(contracts.EthRegistrarController),
          abi: contracts.EthRegistrarController.abi,
        },
        [ns("NameWrapper")]: {
          network: getContractNetwork(contracts.NameWrapper),
          abi: contracts.NameWrapper.abi,
        },
        Resolver: {
          network: getContractNetwork(contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
