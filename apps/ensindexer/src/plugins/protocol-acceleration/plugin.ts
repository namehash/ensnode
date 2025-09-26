import { DatasourceNames, ResolverABI, StandaloneReverseRegistrarABI } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { ChainConfig, createConfig } from "ponder";

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";

/**
 * Describes the indexing behavior for all entities that power Protocol Acceleration:
 * - indexing of ResolverRecords
 * - indexing of LegacyReverseResolvers
 * - indexing of ENSIP-19 StandaloneReverseRegistrars
 */
export const pluginName = PluginName.ProtocolAcceleration;

const ALL_REVERSE_RESOLUTION_DATASOURCE_NAMES = [
  // Resolvers
  DatasourceNames.ENSRoot,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
  DatasourceNames.ThreeDNSOptimism,

  // LegacyReverseResolvers & StandaloneReverseRegistrars
  DatasourceNames.ReverseResolverRoot,
  DatasourceNames.ReverseResolverBase,
  DatasourceNames.ReverseResolverLinea,
  DatasourceNames.ReverseResolverOptimism,
  DatasourceNames.ReverseResolverArbitrum,
  DatasourceNames.ReverseResolverScroll,
] as const;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: ALL_REVERSE_RESOLUTION_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const allDatasources = ALL_REVERSE_RESOLUTION_DATASOURCE_NAMES.map((datasourceName) =>
      getDatasourceAsFullyDefinedAtCompileTime(config.namespace, datasourceName),
    );

    // TODO: need to make this generic enough to run in non-mainnet namespaces, filter out empty
    // datasources
    const root = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ENSRoot,
    );
    const basenames = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Basenames,
    );
    const lineanames = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Lineanames,
    );
    const threeDNSOptimism = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSOptimism,
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
        // a multi-chain Resolver ContractConfig
        [namespaceContract(pluginName, "Resolver")]: {
          abi: ResolverABI,
          chain: {
            // index all Resolver contracts on ENS Root
            ...chainConfigForContract(
              config.globalBlockrange,
              root.chain.id,
              root.contracts.Resolver,
            ),
            // index all Resolver contracts on Base (includes ThreeDNSToken)
            ...chainConfigForContract(
              config.globalBlockrange,
              basenames.chain.id,
              basenames.contracts.Resolver,
            ),
            // index all Resolver contracts on Linea
            ...chainConfigForContract(
              config.globalBlockrange,
              lineanames.chain.id,
              lineanames.contracts.Resolver,
            ),
            // index ThreeDNSToken as Resolver on Optimism
            ...chainConfigForContract(
              config.globalBlockrange,
              threeDNSOptimism.chain.id,
              threeDNSOptimism.contracts.Resolver,
            ),
          },
        },

        // a multi-chain LegacyReverseResolver ContractConfig
        [namespaceContract(pluginName, "LegacyReverseResolver")]: {
          abi: ResolverABI,
          chain: {
            // the Root chain's DefaultReverseResolver2 is a LegacyReverseResolver
            ...chainConfigForContract(
              config.globalBlockrange,
              rrRoot.chain.id,
              rrRoot.contracts.DefaultReverseResolver2,
            ),
          },
        },

        // a multi-chain StandaloneReverseRegistrar ContractConfig
        [namespaceContract(pluginName, "StandaloneReverseRegistrar")]: {
          abi: StandaloneReverseRegistrarABI,
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
        },
      },
    });
  },
});
