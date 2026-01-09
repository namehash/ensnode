/**
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource.
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

const pluginName = PluginName.Basenames;

const REQUIRED_DATASOURCE_NAMES = [DatasourceNames.Basenames];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      basenames: { chain, contracts },
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
        [namespaceContract(pluginName, "UpgradeableRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.UpgradeableRegistrarController,
          ),
          abi: contracts.UpgradeableRegistrarController.abi,
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
