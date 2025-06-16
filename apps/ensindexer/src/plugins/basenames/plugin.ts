/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */

import { definePlugin } from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default definePlugin({
  name: PluginName.Basenames,
  requiredDatasources: [DatasourceName.Basenames],
  buildPonderConfig({ datasourceConfigOptions, namespace }) {
    const { contracts, networkConfigForContract, networksConfigForChain } = datasourceConfigOptions(
      DatasourceName.Basenames,
    );

    return createPonderConfig({
      networks: networksConfigForChain(),
      contracts: {
        [namespace("Registry")]: {
          network: networkConfigForContract(contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespace("BaseRegistrar")]: {
          network: networkConfigForContract(contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespace("EARegistrarController")]: {
          network: networkConfigForContract(contracts.EARegistrarController),
          abi: contracts.EARegistrarController.abi,
        },
        [namespace("RegistrarController")]: {
          network: networkConfigForContract(contracts.RegistrarController),
          abi: contracts.RegistrarController.abi,
        },
        Resolver: {
          network: networkConfigForContract(contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
