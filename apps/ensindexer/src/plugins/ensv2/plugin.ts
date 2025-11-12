import { type ChainConfig, createConfig } from "ponder";

import {
  type DatasourceName,
  DatasourceNames,
  ENSNamespaceIds,
  EnhancedAccessControlABI,
  getDatasource,
  maybeGetDatasource,
  RegistryABI,
} from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";

/**

 */
export const pluginName = PluginName.ENSv2;

const REQUIRED_DATASOURCE_NAMES = [
  DatasourceNames.ENSRoot,
  DatasourceNames.Namechain,
] as const satisfies DatasourceName[];

const ALL_DATASOURCE_NAMES = [
  ...REQUIRED_DATASOURCE_NAMES,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
] as const satisfies DatasourceName[];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    // TODO: remove this, helps with types while only targeting ens-test-env
    if (config.namespace !== ENSNamespaceIds.EnsTestEnv) throw new Error("only ens-test-env");

    const ensroot = getDatasource(config.namespace, DatasourceNames.ENSRoot);
    const namechain = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Namechain,
    );
    const basenames = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Basenames,
    );
    const lineanames = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Lineanames,
    );

    const allDatasources = ALL_DATASOURCE_NAMES.map((datasourceName) =>
      maybeGetDatasource(config.namespace, datasourceName),
    ).filter((datasource) => !!datasource);

    return createConfig({
      chains: allDatasources
        .map((datasource) => datasource.chain)
        .reduce<Record<string, ChainConfig>>(
          (memo, chain) => ({
            ...memo,
            ...chainsConnectionConfig(config.rpcConfigs, chain.id),
          }),
          {},
        ),

      contracts: {
        [namespaceContract(pluginName, "Registry")]: {
          abi: RegistryABI,
          chain: [ensroot, namechain].reduce(
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
          chain: [ensroot, namechain].reduce(
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
      },
    });
  },
});
