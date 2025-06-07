import { definePlugin } from "@/lib/plugin-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { createConfig as createPonderConfig } from "ponder";

/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
export default definePlugin({
  name: PluginName.Lineanames,
  requiredDatasources: [DatasourceName.Lineanames],
  indexingHandlers() {
    return [
      // import("./handlers/Registry"),
      // import("./handlers/Registrar"),
      // import("./handlers/NameWrapper"),
      // import("../shared/Resolver"),
    ];
  },
  buildPonderConfig({ datasourceConfigOptions, namespace }) {
    const { contracts, networkConfigForContract, networksConfigForChain } = datasourceConfigOptions(
      DatasourceName.Lineanames,
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
