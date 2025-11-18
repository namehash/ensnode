/**
 * The `registrars` plugin indexes data about ENS subregistries, specifically the
 * registrar and registrar controller contracts that manage registrations and renewals
 * for known subregistry base registrars for the following:
 * - Ethnames
 * - Basenames
 * - Lineanames
 */

import * as ponder from "ponder";

import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";

const pluginName = PluginName.Registrars;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [
    DatasourceNames.ENSRoot,
    DatasourceNames.Basenames,
    DatasourceNames.Lineanames,
  ],
  createPonderConfig(config) {
    // configure Ethnames dependencies
    const ethnamesDatasource = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ENSRoot,
    );

    const ethnamesRegistrarContracts = {
      [namespaceContract(pluginName, "Ethnames_BaseRegistrar")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          ethnamesDatasource.chain.id,
          ethnamesDatasource.contracts.BaseRegistrar,
        ),
        abi: ethnamesDatasource.contracts.BaseRegistrar.abi,
      },
    };

    const ethnamesRegistrarControllerContracts = {
      [namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          ethnamesDatasource.chain.id,
          ethnamesDatasource.contracts.LegacyEthRegistrarController,
        ),
        abi: ethnamesDatasource.contracts.LegacyEthRegistrarController.abi,
      },
      [namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          ethnamesDatasource.chain.id,
          ethnamesDatasource.contracts.WrappedEthRegistrarController,
        ),
        abi: ethnamesDatasource.contracts.WrappedEthRegistrarController.abi,
      },
      [namespaceContract(pluginName, "Ethnames_UnwrappedEthRegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          ethnamesDatasource.chain.id,
          ethnamesDatasource.contracts.UnwrappedEthRegistrarController,
        ),
        abi: ethnamesDatasource.contracts.UnwrappedEthRegistrarController.abi,
      },
      [namespaceContract(pluginName, "Ethnames_UniversalRegistrarRenewalWithReferrer")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          ethnamesDatasource.chain.id,
          ethnamesDatasource.contracts.UniversalRegistrarRenewalWithReferrer,
        ),
        abi: ethnamesDatasource.contracts.UniversalRegistrarRenewalWithReferrer.abi,
      },
    };

    // configure Basenames dependencies
    const basenamesDatasource = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Basenames,
    );

    const basenamesRegistrarContracts = {
      [namespaceContract(pluginName, "Basenames_BaseRegistrar")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          basenamesDatasource.chain.id,
          basenamesDatasource.contracts.BaseRegistrar,
        ),
        abi: basenamesDatasource.contracts.BaseRegistrar.abi,
      },
    };

    const basenamesRegistrarControllerContracts = {
      [namespaceContract(pluginName, "Basenames_EARegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          basenamesDatasource.chain.id,
          basenamesDatasource.contracts.EARegistrarController,
        ),
        abi: basenamesDatasource.contracts.EARegistrarController.abi,
      },
      [namespaceContract(pluginName, "Basenames_RegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          basenamesDatasource.chain.id,
          basenamesDatasource.contracts.RegistrarController,
        ),
        abi: basenamesDatasource.contracts.RegistrarController.abi,
      },
      [namespaceContract(pluginName, "Basenames_UpgradeableRegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          basenamesDatasource.chain.id,
          basenamesDatasource.contracts.UpgradeableRegistrarController,
        ),
        abi: basenamesDatasource.contracts.UpgradeableRegistrarController.abi,
      },
    };

    // configure Lineanames dependencies
    const linenamesDatasource = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Lineanames,
    );

    const lineanamesRegistrarContracts = {
      [namespaceContract(pluginName, "Lineanames_BaseRegistrar")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          linenamesDatasource.chain.id,
          linenamesDatasource.contracts.BaseRegistrar,
        ),
        abi: linenamesDatasource.contracts.BaseRegistrar.abi,
      },
    };

    const lineanamesRegistrarControllerContracts = {
      [namespaceContract(pluginName, "Lineanames_EthRegistrarController")]: {
        chain: chainConfigForContract(
          config.globalBlockrange,
          linenamesDatasource.chain.id,
          linenamesDatasource.contracts.EthRegistrarController,
        ),
        abi: linenamesDatasource.contracts.EthRegistrarController.abi,
      },
    };

    return ponder.createConfig({
      chains: {
        ...chainsConnectionConfig(config.rpcConfigs, ethnamesDatasource.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, basenamesDatasource.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, linenamesDatasource.chain.id),
      },
      contracts: {
        ...ethnamesRegistrarContracts,
        ...ethnamesRegistrarControllerContracts,
        ...basenamesRegistrarContracts,
        ...basenamesRegistrarControllerContracts,
        ...lineanamesRegistrarContracts,
        ...lineanamesRegistrarControllerContracts,
      },
    });
  },
});
