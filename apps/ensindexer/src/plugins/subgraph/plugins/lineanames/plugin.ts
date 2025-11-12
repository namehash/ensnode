/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */

import * as ponder from "ponder";

import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfigForDatasources,
  getRequiredDatasources,
} from "@/lib/ponder-helpers";

const pluginName = PluginName.Lineanames;

const REQUIRED_DATASOURCE_NAMES = [DatasourceNames.Lineanames];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      lineanames: { chain, contracts },
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    return ponder.createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        REQUIRED_DATASOURCE_NAMES,
      ),
      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.Registry),
          abi: contracts.Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "EthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.EthRegistrarController,
          ),
          abi: contracts.EthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "NameWrapper")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.NameWrapper),
          abi: contracts.NameWrapper.abi,
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
