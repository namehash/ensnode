/**
 * The Subgraph plugin describes indexing behavior for the 'Root' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
 */

import { buildPlugin } from "@/lib/plugin-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default buildPlugin({
  name: PluginName.Subgraph,
  requiredDatasources: [DatasourceNames.ENSRoot],
  buildPonderConfig({ datasourceConfigOptions, pluginNamespace: ns }) {
    const { contracts, networks, getContractNetwork } = datasourceConfigOptions(
      DatasourceNames.ENSRoot,
    );

    return createPonderConfig({
      networks,
      contracts: {
        [ns("RegistryOld")]: {
          network: getContractNetwork(contracts.RegistryOld),
          abi: contracts.Registry.abi,
        },
        [ns("Registry")]: {
          network: getContractNetwork(contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [ns("BaseRegistrar")]: {
          network: getContractNetwork(contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [ns("EthRegistrarControllerOld")]: {
          network: getContractNetwork(contracts.EthRegistrarControllerOld),
          abi: contracts.EthRegistrarControllerOld.abi,
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
