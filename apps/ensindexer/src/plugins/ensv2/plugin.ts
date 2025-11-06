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

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";

/**

 */
export const pluginName = PluginName.ENSv2;

const ALL_DATASOURCE_NAMES = [
  DatasourceNames.ENSRoot,
  DatasourceNames.Namechain,
] as const satisfies DatasourceName[];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: ALL_DATASOURCE_NAMES,
  createPonderConfig(config) {
    // TODO: remove this, helps with types while only targeting ens-test-env
    if (config.namespace !== ENSNamespaceIds.EnsTestEnv) process.exit(1);

    const ensroot = getDatasource(config.namespace, DatasourceNames.ENSRoot);
    // biome-ignore lint/style/noNonNullAssertion: allowed for now
    const namechain = maybeGetDatasource(config.namespace, DatasourceNames.Namechain)!;

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
      },
    });
  },
});
