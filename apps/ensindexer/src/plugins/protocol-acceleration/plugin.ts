import { createConfig } from "ponder";

import {
  DatasourceNames,
  RegistryABI,
  ResolverABI,
  StandaloneReverseRegistrarABI,
  ThreeDNSTokenABI,
} from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import {
  DATASOURCE_NAMES_WITH_RESOLVERS,
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
const DATASOURCE_NAMES_WITH_REVERSE_RESOLVERS = [
  DatasourceNames.ReverseResolverRoot,
  DatasourceNames.ReverseResolverBase,
  DatasourceNames.ReverseResolverLinea,
  DatasourceNames.ReverseResolverOptimism,
  DatasourceNames.ReverseResolverArbitrum,
  DatasourceNames.ReverseResolverScroll,
];

const ALL_DATASOURCE_NAMES = [
  ...DATASOURCE_NAMES_WITH_RESOLVERS,
  ...DATASOURCE_NAMES_WITH_REVERSE_RESOLVERS,
];

const REQUIRED_DATASOURCE_NAMES = [DatasourceNames.ENSRoot];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const { ensroot } = getRequiredDatasources(config.namespace, REQUIRED_DATASOURCE_NAMES);
    const {
      namechain,
      basenames,
      lineanames,
      threednsOptimism,
      threednsBase,
      rrRoot,
      rrBase,
      rrLinea,
      rrOptimism,
      rrArbitrum,
      rrScroll,
    } = maybeGetDatasources(config.namespace, ALL_DATASOURCE_NAMES);

    return createConfig({
      chains: chainsConnectionConfigForDatasources(
        config.namespace,
        config.rpcConfigs,
        ALL_DATASOURCE_NAMES,
      ),
      contracts: {
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
                datasource.contracts.Resolver,
              ),
            }),
            {},
          ),
        },

        /////////////////////
        // ENSv1 RegistryOld
        /////////////////////
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

        ////////////////////////////
        // ENSv1 Registry Contracts
        ////////////////////////////
        [namespaceContract(pluginName, "ENSv1Registry")]: {
          abi: ensroot.contracts.ENSv1Registry.abi,
          chain: {
            // ENS Root Chain Registry
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.ENSv1Registry,
            ),
            // Basenames (shadow)Registry
            ...(basenames &&
              chainConfigForContract(
                config.globalBlockrange,
                basenames.chain.id,
                basenames.contracts.Registry,
              )),
            // Lineanames (shadow)Registry
            ...(lineanames &&
              chainConfigForContract(
                config.globalBlockrange,
                lineanames.chain.id,
                lineanames.contracts.Registry,
              )),
          },
        },

        ////////////////////////////
        // ENSv2 Registry Contracts
        ////////////////////////////
        [namespaceContract(pluginName, "ENSv2Registry")]: {
          abi: RegistryABI,
          chain: {
            // TODO(ensv2-coverage): remove this conditional once ENSv2 exists in all namespaces
            ...("Registry" in ensroot.contracts &&
              chainConfigForContract(
                config.globalBlockrange,
                ensroot.chain.id,
                ensroot.contracts.Registry,
              )),
            ...(namechain &&
              chainConfigForContract(
                config.globalBlockrange,
                namechain.chain.id,
                namechain.contracts.Registry,
              )),
          },
        },

        /////////////////
        // ThreeDNSToken
        /////////////////
        [namespaceContract(pluginName, "ThreeDNSToken")]: {
          abi: ThreeDNSTokenABI,
          chain: {
            ...(threednsOptimism &&
              chainConfigForContract(
                config.globalBlockrange,
                threednsOptimism.chain.id,
                threednsOptimism.contracts.ThreeDNSToken,
              )),
            ...(threednsBase &&
              chainConfigForContract(
                config.globalBlockrange,
                threednsBase.chain.id,
                threednsBase.contracts.ThreeDNSToken,
              )),
          },
        },

        ///////////////////////////////
        // StandaloneReverseRegistrars
        ///////////////////////////////
        [namespaceContract(pluginName, "StandaloneReverseRegistrar")]: {
          abi: StandaloneReverseRegistrarABI,
          chain: {
            // the Root chain's DefaultReverseRegistrar (is StandaloneReverseRegistrar)
            ...(rrRoot &&
              chainConfigForContract(
                config.globalBlockrange,
                rrRoot.chain.id,
                rrRoot.contracts.DefaultReverseRegistrar,
              )),
            // Base's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...(rrBase &&
              chainConfigForContract(
                config.globalBlockrange,
                rrBase.chain.id,
                rrBase.contracts.L2ReverseRegistrar,
              )),
            // Linea's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...(rrLinea &&
              chainConfigForContract(
                config.globalBlockrange,
                rrLinea.chain.id,
                rrLinea.contracts.L2ReverseRegistrar,
              )),
            // Optimism's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...(rrOptimism &&
              chainConfigForContract(
                config.globalBlockrange,
                rrOptimism.chain.id,
                rrOptimism.contracts.L2ReverseRegistrar,
              )),
            // Arbitrum's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...(rrArbitrum &&
              chainConfigForContract(
                config.globalBlockrange,
                rrArbitrum.chain.id,
                rrArbitrum.contracts.L2ReverseRegistrar,
              )),
            // Scroll's L2ReverseRegistrar (is StandaloneReverseRegistrar)
            ...(rrScroll &&
              chainConfigForContract(
                config.globalBlockrange,
                rrScroll.chain.id,
                rrScroll.contracts.L2ReverseRegistrar,
              )),
          },
        },
      },
    });
  },
});
