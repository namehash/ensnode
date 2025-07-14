import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { ChainConfig, createConfig } from "ponder";

import { createPlugin, getDatasourceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";

/**
 * Describes the indexing behavior for every known ENSIP-19 L2 Reverse Resolver.
 */
export const pluginName = PluginName.ReverseResolvers;

// NOTE: const-ed to keep inferred types in createPonderConfig
const ALL_REVERSE_RESOLUTION_DATASOURCE_NAMES = [
  DatasourceNames.ReverseResolverRoot,
  DatasourceNames.ReverseResolverBase,
  DatasourceNames.ReverseResolverLinea,
  DatasourceNames.ReverseResolverOptimism,
  DatasourceNames.ReverseResolverArbitrum,
  DatasourceNames.ReverseResolverScroll,
] as const;

// all datasource names that include an L2ReverseRegistrar contract
const L2_REVERSE_REGISTRAR_DATASOURCE_NAMES = [
  DatasourceNames.ReverseResolverBase,
  DatasourceNames.ReverseResolverLinea,
  DatasourceNames.ReverseResolverArbitrum,
  DatasourceNames.ReverseResolverOptimism,
  DatasourceNames.ReverseResolverScroll,
] as const;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: ALL_REVERSE_RESOLUTION_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const allDatasources = ALL_REVERSE_RESOLUTION_DATASOURCE_NAMES.map((datasourceName) =>
      getDatasourceAsFullyDefinedAtCompileTime(config.namespace, datasourceName),
    );

    const rrRoot = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ReverseResolverRoot,
    );
    const rrBase = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ReverseResolverBase,
    );
    const rrLinea = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ReverseResolverLinea,
    );
    const rrOptimism = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ReverseResolverOptimism,
    );
    const rrArbitrum = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ReverseResolverArbitrum,
    );
    const rrScroll = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ReverseResolverScroll,
    );

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
        // a single multi-chain ReverseResolver ContractConfig
        ReverseResolver: {
          chain: {
            // the Root chain's DefaultReverseResolver2
            ...chainConfigForContract(
              config.globalBlockrange,
              rrRoot.chain.id,
              rrRoot.contracts.DefaultReverseResolver2,
            ),
            // Base's ReverseResolver
            ...chainConfigForContract(
              config.globalBlockrange,
              rrBase.chain.id,
              rrBase.contracts.ReverseResolver,
            ),
          },

          // NOTE: all ReverseResolvers share the same abi, just use the first definition
          // TODO: use shared Resolver abi for this
          abi: rrRoot.contracts.DefaultReverseResolver2.abi,
        },

        // a single multi-chain StandaloneReverseRegistrar ContractConfig
        StandaloneReverseRegistrar: {
          chain: {
            // the Root chain's StandaloneReverseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              rrRoot.chain.id,
              rrRoot.contracts.DefaultReverseRegistrar,
            ),
            // Base's L2ReverseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              rrBase.chain.id,
              rrBase.contracts.L2ReverseRegistrar,
            ),
            // Linea's L2ReverseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              rrLinea.chain.id,
              rrLinea.contracts.L2ReverseRegistrar,
            ),
            // Optimism's L2ReverseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              rrOptimism.chain.id,
              rrOptimism.contracts.L2ReverseRegistrar,
            ),
            // Arbitrum's L2ReverseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              rrArbitrum.chain.id,
              rrArbitrum.contracts.L2ReverseRegistrar,
            ),
            // Scroll's L2ReverseRegistrar
            ...chainConfigForContract(
              config.globalBlockrange,
              rrScroll.chain.id,
              rrScroll.contracts.L2ReverseRegistrar,
            ),
          },
          // NOTE: all StandaloneReverseRegistrar share the same abi, just use the first definition
          // TODO: export this shared abi from sdk and re-use it here
          abi: rrRoot.contracts.DefaultReverseRegistrar.abi,
        },
      },
    });
  },
});
