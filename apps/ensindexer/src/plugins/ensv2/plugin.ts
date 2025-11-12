/**
 * TODO
 */

import { createConfig } from "ponder";

import { DatasourceNames, EnhancedAccessControlABI, RegistryABI } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfigForDatasources,
  getRequiredDatasources,
  maybeGetDatasources,
} from "@/lib/ponder-helpers";

export const pluginName = PluginName.ENSv2;

const REQUIRED_DATASOURCE_NAMES = [
  DatasourceNames.ENSRoot, //
  DatasourceNames.Namechain,
];

const ALL_DATASOURCE_NAMES = [
  ...REQUIRED_DATASOURCE_NAMES,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    // TODO: remove this, helps with types while only targeting ens-test-env
    if (config.namespace !== "ens-test-env" && config.namespace !== "mainnet") {
      throw new Error("only ens-test-env and mainnet");
    }

    const {
      ensroot, //
      namechain,
    } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);

    const {
      basenames, //
      lineanames,
    } = maybeGetDatasources(config.namespace, ALL_DATASOURCE_NAMES);

    return createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        ALL_DATASOURCE_NAMES,
      ),

      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          abi: RegistryABI,
          chain: [ensroot, namechain]
            .filter((ds) => !!ds)
            .reduce(
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
        [namespaceContract(pluginName, "EnhancedAccessControl")]: {
          abi: EnhancedAccessControlABI,
          chain: [ensroot, namechain]
            .filter((ds) => !!ds)
            .reduce(
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

        // index the ENSv1RegistryOld on ENS Root Chain
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

        // index ENSv1Registry on ENS Root Chain, Basenames, Lineanames
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

        // index NameWrapper on ENS Root Chain, Lineanames
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
      },
    });
  },
});
