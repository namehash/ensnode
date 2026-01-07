/**
 * The `registrars` plugin indexes data about ENS subregistries, specifically the
 * registrar and registrar controller contracts that manage registrations and renewals
 * for known subregistry base registrars for the following:
 * - Ethnames
 * - Basenames
 * - Lineanames
 */

import { createConfig } from "ponder";

import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfigForDatasources,
  getRequiredDatasources,
} from "@/lib/ponder-helpers";

const pluginName = PluginName.Registrars;

const REQUIRED_DATASOURCE_NAMES = [
  DatasourceNames.ENSRoot,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      ensroot: ethnames,
      basenames,
      lineanames,
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    return createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        REQUIRED_DATASOURCE_NAMES,
      ),
      contracts: {
        //////////////////////
        // Ethnames Registrar
        //////////////////////
        [namespaceContract(pluginName, "Ethnames_BaseRegistrar")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            ethnames.chain.id,
            ethnames.contracts.BaseRegistrar,
          ),
          abi: ethnames.contracts.BaseRegistrar.abi,
        },

        //////////////////////////////////
        // Ethnames Registrar Controllers
        //////////////////////////////////
        [namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            ethnames.chain.id,
            ethnames.contracts.LegacyEthRegistrarController,
          ),
          abi: ethnames.contracts.LegacyEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            ethnames.chain.id,
            ethnames.contracts.WrappedEthRegistrarController,
          ),
          abi: ethnames.contracts.WrappedEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "Ethnames_UnwrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            ethnames.chain.id,
            ethnames.contracts.UnwrappedEthRegistrarController,
          ),
          abi: ethnames.contracts.UnwrappedEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "Ethnames_UniversalRegistrarRenewalWithReferrer")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            ethnames.chain.id,
            ethnames.contracts.UniversalRegistrarRenewalWithReferrer,
          ),
          abi: ethnames.contracts.UniversalRegistrarRenewalWithReferrer.abi,
        },

        ///////////////////////
        // Basenames Registrar
        ///////////////////////
        [namespaceContract(pluginName, "Basenames_BaseRegistrar")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenames.chain.id,
            basenames.contracts.BaseRegistrar,
          ),
          abi: basenames.contracts.BaseRegistrar.abi,
        },

        ///////////////////////////////////
        // Basenames Registrar Controllers
        ///////////////////////////////////
        [namespaceContract(pluginName, "Basenames_EARegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenames.chain.id,
            basenames.contracts.EARegistrarController,
          ),
          abi: basenames.contracts.EARegistrarController.abi,
        },
        [namespaceContract(pluginName, "Basenames_RegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenames.chain.id,
            basenames.contracts.RegistrarController,
          ),
          abi: basenames.contracts.RegistrarController.abi,
        },
        [namespaceContract(pluginName, "Basenames_UpgradeableRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenames.chain.id,
            basenames.contracts.UpgradeableRegistrarController,
          ),
          abi: basenames.contracts.UpgradeableRegistrarController.abi,
        },

        ////////////////////////
        // Lineanames Registrar
        ////////////////////////
        [namespaceContract(pluginName, "Lineanames_BaseRegistrar")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            lineanames.chain.id,
            lineanames.contracts.BaseRegistrar,
          ),
          abi: lineanames.contracts.BaseRegistrar.abi,
        },

        ////////////////////////////////////
        // Lineanames Registrar Controllers
        ////////////////////////////////////
        [namespaceContract(pluginName, "Lineanames_EthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            lineanames.chain.id,
            lineanames.contracts.EthRegistrarController,
          ),
          abi: lineanames.contracts.EthRegistrarController.abi,
        },
      },
    });
  },
});
