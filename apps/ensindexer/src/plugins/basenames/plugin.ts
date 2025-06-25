/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */

import { buildPlugin } from "@/lib/plugin-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default buildPlugin({
  name: PluginName.Basenames,
  requiredDatasources: [DatasourceNames.Basenames],
  buildPonderConfig({ datasourceConfigOptions, pluginNamespace: ns }) {
    const { contracts, networks, getContractNetwork } = datasourceConfigOptions(
      DatasourceNames.Basenames,
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
        [ns("EARegistrarController")]: {
          network: getContractNetwork(contracts.EARegistrarController),
          abi: contracts.EARegistrarController.abi,
        },
        [ns("RegistrarController")]: {
          network: getContractNetwork(contracts.RegistrarController),
          abi: contracts.RegistrarController.abi,
        },
        Resolver: {
          network: getContractNetwork(contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
