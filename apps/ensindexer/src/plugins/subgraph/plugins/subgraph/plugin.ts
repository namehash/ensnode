/**
 * The Subgraph plugin describes indexing behavior for the 'ENSRoot' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
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

const pluginName = PluginName.Subgraph;

const REQUIRED_DATASOURCE_NAMES = [DatasourceNames.ENSRoot];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      ensroot: { chain, contracts },
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    return ponder.createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        REQUIRED_DATASOURCE_NAMES,
      ),
      contracts: {
        [namespaceContract(pluginName, "ENSv1RegistryOld")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.ENSv1RegistryOld,
          ),
          abi: contracts.ENSv1RegistryOld.abi,
        },
        [namespaceContract(pluginName, "ENSv1Registry")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.ENSv1RegistryOld,
          ),
          abi: contracts.ENSv1Registry.abi,
        },
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          chain: chainConfigForContract(config.globalBlockrange, chain.id, contracts.BaseRegistrar),
          abi: contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "LegacyEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.LegacyEthRegistrarController,
          ),
          abi: contracts.LegacyEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "WrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.WrappedEthRegistrarController,
          ),
          abi: contracts.WrappedEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "UnwrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.UnwrappedEthRegistrarController,
          ),
          abi: contracts.UnwrappedEthRegistrarController.abi,
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
