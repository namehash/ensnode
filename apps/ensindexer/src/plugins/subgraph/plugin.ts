/**
 * The Subgraph plugin describes indexing behavior for the 'Root' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
 */

import { definePlugin } from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

export default definePlugin({
  name: PluginName.Subgraph,
  requiredDatasources: [DatasourceName.Root],
  buildPonderConfig({ datasourceConfigOptions, namespace }) {
    const { contracts, networkConfigForContract, networksConfigForChain } = datasourceConfigOptions(
      DatasourceName.Root,
    );

    return createPonderConfig({
      networks: networksConfigForChain(),
      contracts: {
        [namespace("RegistryOld")]: {
          network: networkConfigForContract(contracts.RegistryOld),
          abi: contracts.Registry.abi,
        },
        [namespace("Registry")]: {
          network: networkConfigForContract(contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespace("BaseRegistrar")]: {
          network: networkConfigForContract(contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespace("EthRegistrarControllerOld")]: {
          network: networkConfigForContract(contracts.EthRegistrarControllerOld),
          abi: contracts.EthRegistrarControllerOld.abi,
        },
        [namespace("EthRegistrarController")]: {
          network: networkConfigForContract(contracts.EthRegistrarController),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespace("NameWrapper")]: {
          network: networkConfigForContract(contracts.NameWrapper),
          abi: contracts.NameWrapper.abi,
        },
        Resolver: {
          network: networkConfigForContract(contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
