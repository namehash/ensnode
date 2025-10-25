/**
 * The Referrals plugin indexes registration and renewal referral data emitted by the `UnwrappedEthRegistrarController` contract.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

const pluginName = PluginName.Subregistry;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.ENSRoot],
  createPonderConfig(config) {
    const rootChainDatasource = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ENSRoot,
    );

    const basenamesDatasource = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Basenames,
    );

    const linenamesDatasource = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Lineanames,
    );

    const registrarContracts = {
      ["eth"]: {
        [namespaceContract(pluginName, "Eth_BaseRegistrar")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            rootChainDatasource.chain.id,
            rootChainDatasource.contracts.BaseRegistrar,
          ),
          abi: rootChainDatasource.contracts.BaseRegistrar.abi,
        },
      },
      ["base.eth"]: {
        [namespaceContract(pluginName, "BaseEth_BaseRegistrar")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenamesDatasource.chain.id,
            basenamesDatasource.contracts.BaseRegistrar,
          ),
          abi: basenamesDatasource.contracts.BaseRegistrar.abi,
        },
      },
      ["linea.eth"]: {
        [namespaceContract(pluginName, "LineaEth_BaseRegistrar")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            linenamesDatasource.chain.id,
            linenamesDatasource.contracts.BaseRegistrar,
          ),
          abi: linenamesDatasource.contracts.BaseRegistrar.abi,
        },
      },
    };

    const registrarControllerContracts = {
      ["eth"]: {
        [namespaceContract(pluginName, "Eth_LegacyEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            rootChainDatasource.chain.id,
            rootChainDatasource.contracts.LegacyEthRegistrarController,
          ),
          abi: rootChainDatasource.contracts.LegacyEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "Eth_WrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            rootChainDatasource.chain.id,
            rootChainDatasource.contracts.WrappedEthRegistrarController,
          ),
          abi: rootChainDatasource.contracts.WrappedEthRegistrarController.abi,
        },
        [namespaceContract(pluginName, "Eth_UnwrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            rootChainDatasource.chain.id,
            rootChainDatasource.contracts.UnwrappedEthRegistrarController,
          ),
          abi: rootChainDatasource.contracts.UnwrappedEthRegistrarController.abi,
        },
      },

      ["base.eth"]: {
        [namespaceContract(pluginName, "BaseEth_EARegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenamesDatasource.chain.id,
            basenamesDatasource.contracts.EARegistrarController,
          ),
          abi: basenamesDatasource.contracts.EARegistrarController.abi,
        },
        [namespaceContract(pluginName, "BaseEth_RegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenamesDatasource.chain.id,
            basenamesDatasource.contracts.RegistrarController,
          ),
          abi: basenamesDatasource.contracts.RegistrarController.abi,
        },
        [namespaceContract(pluginName, "BaseEth_UpgradeableRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            basenamesDatasource.chain.id,
            basenamesDatasource.contracts.UpgradeableRegistrarController,
          ),
          abi: basenamesDatasource.contracts.UpgradeableRegistrarController.abi,
        },
      },

      ["linea.eth"]: {
        [namespaceContract(pluginName, "LineaEth_EthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            linenamesDatasource.chain.id,
            linenamesDatasource.contracts.EthRegistrarController,
          ),
          abi: linenamesDatasource.contracts.EthRegistrarController.abi,
        },
      },
    };

    return ponder.createConfig({
      chains: {
        ...chainsConnectionConfig(config.rpcConfigs, rootChainDatasource.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, basenamesDatasource.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, linenamesDatasource.chain.id),
      },
      contracts: {
        ...registrarContracts["eth"],
        ...registrarControllerContracts["eth"],
        ...registrarContracts["base.eth"],
        ...registrarControllerContracts["base.eth"],
        ...registrarContracts["linea.eth"],
        ...registrarControllerContracts["linea.eth"],
      },
    });
  },
});
