/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainConnectionConfig } from "@/lib/ponder-helpers";
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
      chains: {
        ...chainConnectionConfig(config.rpcConfigs, chain.id),
      },
      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EARegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.EARegistrarController,
          ),
          abi: contracts.EARegistrarController.abi,
        },
        [namespaceContract(pluginName, "RegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.RegistrarController,
          ),
          abi: contracts.RegistrarController.abi,
        },
        // NOTE: shared (non-namespaced) Resolver definition/implementation (see plugins/shared/Resolver.ts)
        Resolver: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
});
