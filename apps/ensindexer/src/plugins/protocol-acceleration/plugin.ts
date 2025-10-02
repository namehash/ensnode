import {
  DatasourceName,
  DatasourceNames,
  ResolverABI,
  StandaloneReverseRegistrarABI,
} from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { ChainConfig, createConfig } from "ponder";

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";
import { DATASOURCES_WITH_RESOLVERS } from "@/lib/protocol-acceleration/datasources-with-resolvers";
import { resolverContractConfig } from "@/lib/resolver-contract-config";

/**
 * Describes the indexing behavior for all entities that power Protocol Acceleration:
 * - indexing of Resolver Records for all Resolver contracts on ENS Root, Base, Linea, and Optimism
 *   - in order to accelerate Forward Resolution
 * - indexing of Node-Resolver Relationships for ENS Root, Basenames, Lineanames, and ThreeDNS
 *   - in order to accelerate UniversalResolver#findResolver
 * - indexing of ENSIP-19 StandaloneReverseRegistrars for Base, Linea, Optimism, Arbitrum, and Scroll
 *   - in order to accelerate ENSIP-19 Reverse Resolvers
 */
export const pluginName = PluginName.ProtocolAcceleration;

/**
 * The set of DatasourceNames that include the ENSIP-19 StandaloneReverseRegistrar contracts.
 */
const DATASOURCES_WITH_REVERSE_RESOLVERS = [
  DatasourceNames.ReverseResolverRoot,
  DatasourceNames.ReverseResolverBase,
  DatasourceNames.ReverseResolverLinea,
  DatasourceNames.ReverseResolverOptimism,
  DatasourceNames.ReverseResolverArbitrum,
  DatasourceNames.ReverseResolverScroll,
] as const satisfies DatasourceName[];

const ALL_DATASOURCE_NAMES = [
  ...DATASOURCES_WITH_RESOLVERS,
  ...DATASOURCES_WITH_REVERSE_RESOLVERS,
] as const satisfies DatasourceName[];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: ALL_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const allDatasources = ALL_DATASOURCE_NAMES.map((datasourceName) =>
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
    const threeDNSBase = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSBase,
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
        [namespaceContract(pluginName, "Resolver")]: resolverContractConfig(
          config.namespace,
          DATASOURCES_WITH_RESOLVERS,
          config.globalBlockrange,
        ),

        // index the RegistryOld on ENS Root Chain
        [namespaceContract(pluginName, "RegistryOld")]: {
          abi: root.contracts.RegistryOld.abi,
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              root.chain.id,
              root.contracts.RegistryOld,
            ),
          },
        },

        // a multi-chain Registry ContractConfig
        [namespaceContract(pluginName, "Registry")]: {
          abi: root.contracts.Registry.abi,
          chain: {
            // ENS Root Chain Registry
            ...chainConfigForContract(
              config.globalBlockrange,
              root.chain.id,
              root.contracts.Registry,
            ),
            // Basenames (shadow)Registry
            ...chainConfigForContract(
              config.globalBlockrange,
              basenames.chain.id,
              basenames.contracts.Registry,
            ),
            // Lineanames (shadow)Registry
            ...chainConfigForContract(
              config.globalBlockrange,
              lineanames.chain.id,
              lineanames.contracts.Registry,
            ),
          },
        },

        // a multi-chain ThreeDNSToken ContractConfig
        [namespaceContract(pluginName, "ThreeDNSToken")]: {
          abi: threeDNSOptimism.contracts.ThreeDNSToken.abi,
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              threeDNSOptimism.chain.id,
              threeDNSOptimism.contracts.ThreeDNSToken,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              threeDNSBase.chain.id,
              threeDNSBase.contracts.ThreeDNSToken,
            ),
          },
        },

        // a multi-chain StandaloneReverseRegistrar ContractConfig
        [namespaceContract(pluginName, "StandaloneReverseRegistrar")]: {
          abi: StandaloneReverseRegistrarABI,
          chain: {
            // the Root chain's DefaultReverseRegistrar (is StandaloneReverseRegistrar)
            ...chainConfigForContract(
              config.globalBlockrange,
              rrRoot.chain.id,
              rrRoot.contracts.DefaultReverseRegistrar,
            ),
            // Base's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...chainConfigForContract(
              config.globalBlockrange,
              rrBase.chain.id,
              rrBase.contracts.L2ReverseRegistrar,
            ),
            // Linea's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...chainConfigForContract(
              config.globalBlockrange,
              rrLinea.chain.id,
              rrLinea.contracts.L2ReverseRegistrar,
            ),
            // Optimism's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...chainConfigForContract(
              config.globalBlockrange,
              rrOptimism.chain.id,
              rrOptimism.contracts.L2ReverseRegistrar,
            ),
            // Arbitrum's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...chainConfigForContract(
              config.globalBlockrange,
              rrArbitrum.chain.id,
              rrArbitrum.contracts.L2ReverseRegistrar,
            ),
            // Scroll's L2ReverseRegistrar (is StandaloneReverseRegistrar)
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
