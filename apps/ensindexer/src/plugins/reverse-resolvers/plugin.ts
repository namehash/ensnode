import { DatasourceNames, ResolverABI } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { ChainConfig, createConfig } from "ponder";

import { createPlugin, getDatasourceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfig,
  mergeContractConfigs,
} from "@/lib/ponder-helpers";

/**
 * Describes the indexing behavior for every known ENSIP-19 L2 Reverse Resolver.
 */
export const pluginName = PluginName.ReverseResolvers;

// NOTE: const-ed to keep inferred types in createPonderConfig
const REVERSE_RESOLVER_DATASOURCE_NAMES = [
  DatasourceNames.ReverseResolverRoot,
  DatasourceNames.ReverseResolverBase,
  // TODO: re-enable the following
  // DatasourceNames.ReverseResolverOptimism,
  // DatasourceNames.ReverseResolverArbitrum,
  // DatasourceNames.ReverseResolverScroll,
  // DatasourceNames.ReverseResolverLinea,
] as const;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REVERSE_RESOLVER_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const datasources = REVERSE_RESOLVER_DATASOURCE_NAMES.map((datasourceName) =>
      getDatasourceAsFullyDefinedAtCompileTime(config.namespace, datasourceName),
    );

    return createConfig({
      chains: datasources
        .map((datasource) => datasource.chain)
        .reduce<Record<string, ChainConfig>>(
          (memo, chain) => ({
            ...memo,
            ...chainsConnectionConfig(config.rpcConfigs, chain.id),
          }),
          {},
        ),

      contracts: {
        // a single multi-chain ReverseResolver ContractConfig
        ReverseResolver: {
          abi: ResolverABI,
          // each chain's ReverseResolver gets a `chain` entry via `chainConfigForContract`
          chain: datasources.reduce((memo, datasource) => {
            const contracts = Object.values(
              datasource.contracts,
            ) as (typeof datasource.contracts)[keyof typeof datasource.contracts][];

            // treat all contract configs in this ReverseResolver* Datasource as ReverseResolvers
            const contract = mergeContractConfigs(contracts);

            return {
              ...memo,
              ...chainConfigForContract(config.globalBlockrange, datasource.chain.id, contract),
            };
          }, {}),
        },
      },
    });
  },
});
