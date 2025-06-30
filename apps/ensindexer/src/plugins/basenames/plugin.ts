/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource.
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

const pluginName = PluginName.Basenames;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.Basenames],
  createPonderConfig(config) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Basenames,
    );

    return ponder.createConfig({
      networks: networksConfigForChain(config.rpcConfigs, chain.id),
      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          network: networkConfigForContract(chain.id, config.globalBlockrange, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          network: networkConfigForContract(
            chain.id,
            config.globalBlockrange,
            contracts.BaseRegistrar,
          ),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EARegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            config.globalBlockrange,
            contracts.EARegistrarController,
          ),
          abi: contracts.EARegistrarController.abi,
        },
        [namespaceContract(pluginName, "RegistrarController")]: {
          network: networkConfigForContract(
            chain.id,
            config.globalBlockrange,
            contracts.RegistrarController,
          ),
          abi: contracts.RegistrarController.abi,
        },
        // NOTE: shared (non-namespaced) Resolver definition/implementation (see plugins/shared/Resolver.ts)
        Resolver: {
          network: networkConfigForContract(chain.id, config.globalBlockrange, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
