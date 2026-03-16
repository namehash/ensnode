import { createConfig } from "ponder";

import {
  AnyRegistrarABI,
  AnyRegistrarControllerABI,
  DatasourceNames,
  EnhancedAccessControlABI,
  ETHRegistrarABI,
  RegistryABI,
  ResolverABI,
} from "@ensnode/datasources";
import { buildBlockNumberRange, PluginName } from "@ensnode/ensnode-sdk";
import {
  getDatasourcesWithENSv2Contracts,
  getDatasourcesWithResolvers,
} from "@ensnode/ensnode-sdk/internal";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfigForDatasources,
  constrainBlockrange,
  getRequiredDatasources,
  maybeGetDatasources,
} from "@/lib/ponder-helpers";

export const pluginName = PluginName.ENSv2;

const REQUIRED_DATASOURCE_NAMES = [
  DatasourceNames.ENSRoot, //
];

const ALL_DATASOURCE_NAMES = [
  ...REQUIRED_DATASOURCE_NAMES,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
  DatasourceNames.ENSv2Root,
];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  allDatasourceNames: ALL_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const {
      ensroot, //
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    const {
      ENSv2Root, //
      basenames, //
      lineanames,
    } = maybeGetDatasources(config.namespace, ALL_DATASOURCE_NAMES);

    const DATASOURCES_WITH_ENSV2_CONTRACTS = getDatasourcesWithENSv2Contracts(config.namespace);

    return createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        ALL_DATASOURCE_NAMES,
      ),

      contracts: {
        ////////////////////////////
        // ENSv2 Registry Contracts
        ////////////////////////////
        [namespaceContract(pluginName, "ENSv2Registry")]: {
          abi: RegistryABI,
          chain: DATASOURCES_WITH_ENSV2_CONTRACTS.reduce(
            (memo, datasource) => ({
              ...memo,
              ...chainConfigForContract(
                config.globalBlockrange,
                datasource.chain.id,
                datasource.contracts.Registry,
              ),
            }),
            {},
          ),
        },

        ///////////////////////////////////
        // EnhancedAccessControl Contracts
        ///////////////////////////////////
        [namespaceContract(pluginName, "EnhancedAccessControl")]: {
          abi: EnhancedAccessControlABI,
          chain: DATASOURCES_WITH_ENSV2_CONTRACTS.reduce(
            (memo, datasource) => ({
              ...memo,
              ...chainConfigForContract(
                config.globalBlockrange,
                datasource.chain.id,
                datasource.contracts.EnhancedAccessControl,
              ),
            }),
            {},
          ),
        },

        //////////////////////
        // ENSv2 ETHRegistrar
        //////////////////////
        [namespaceContract(pluginName, "ETHRegistrar")]: {
          abi: ETHRegistrarABI,
          chain: {
            ...(ENSv2Root &&
              chainConfigForContract(
                config.globalBlockrange,
                ENSv2Root.chain.id,
                ENSv2Root.contracts.ETHRegistrar,
              )),
          },
        },

        //////////////////////////////////////
        // ENSv1RegistryOld on ENS Root Chain
        //////////////////////////////////////
        [namespaceContract(pluginName, "ENSv1RegistryOld")]: {
          abi: ensroot.contracts.ENSv1RegistryOld.abi,
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.ENSv1RegistryOld,
            ),
          },
        },

        //////////////////////////////////////
        // ENSv1Registry on
        //   - ENS Root Chain
        //   - Basenames
        //   - Lineanames
        //////////////////////////////////////
        [namespaceContract(pluginName, "ENSv1Registry")]: {
          abi: ensroot.contracts.ENSv1Registry.abi,
          chain: {
            // ENS Root Chain Registry
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.ENSv1Registry,
            ),
            // Basenames (shadow)Registry if defined
            ...(basenames &&
              chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.Registry,
              )),
            // Lineanames (shadow)Registry if defined
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.Registry,
              )),
          },
        },

        //////////////////////////////////////
        // NameWrapper on
        //   - ENS Root Chain
        //   - Lineanames
        //////////////////////////////////////
        [namespaceContract(pluginName, "NameWrapper")]: {
          abi: ensroot.contracts.NameWrapper.abi,
          chain: {
            // ENS Root Chain NameWrapper
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.NameWrapper,
            ),
            // Lineanames NameWrapper if defined
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.NameWrapper,
              )),
          },
        },

        ///////////////////
        // Base Registrars
        ///////////////////
        [namespaceContract(pluginName, "BaseRegistrar")]: {
          abi: AnyRegistrarABI,
          chain: {
            // Ethnames BaseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.BaseRegistrar,
            ),
            // Basenames BaseRegistrar, if defined
            ...(basenames &&
              chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.BaseRegistrar,
              )),
            // Lineanames BaseRegistrar, if defined
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.BaseRegistrar,
              )),
          },
        },

        /////////////////////////
        // Registrar Controllers
        /////////////////////////
        [namespaceContract(pluginName, "RegistrarController")]: {
          abi: AnyRegistrarControllerABI,
          chain: {
            ///////////////////////////////////
            // Ethnames Registrar Controllers
            ///////////////////////////////////
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.LegacyEthRegistrarController,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.WrappedEthRegistrarController,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.UnwrappedEthRegistrarController,
            ),

            ///////////////////////////////////
            // Basenames Registrar Controllers
            ///////////////////////////////////
            ...(basenames && {
              ...chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.EARegistrarController,
              ),
              ...chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.RegistrarController,
              ),
              ...chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.UpgradeableRegistrarController,
              ),
            }),

            ////////////////////////////////////
            // Lineanames Registrar Controllers
            ////////////////////////////////////
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.EthRegistrarController,
              )),
          },
        },

        //////////////////////
        // Resolver Contracts
        //////////////////////
        [namespaceContract(pluginName, "Resolver")]: {
          abi: ResolverABI,
          chain: getDatasourcesWithResolvers(config.namespace).reduce(
            (memo, datasource) => ({
              ...memo,
              [datasource.chain.id.toString()]: constrainBlockrange(
                config.globalBlockrange,
                buildBlockNumberRange(
                  datasource.contracts.Resolver.startBlock,
                  datasource.contracts.Resolver.endBlock,
                ),
              ),
            }),
            {},
          ),
        },
      },
    });
  },
});
