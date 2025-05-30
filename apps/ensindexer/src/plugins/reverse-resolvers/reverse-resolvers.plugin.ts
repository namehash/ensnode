import { createConfig } from "ponder";

import config from "@/config";
import {
  ENSIndexerPlugin,
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { mergeContractConfigs } from "@/lib/ponder-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Describes the indexing behavior for every known ENSIP-19 L2 Reverse Resolver.
 */
export const pluginName = PluginName.ReverseResolvers;

// NOTE: namespace unused because we're only indexing multi-network Resolver contracts
const namespace = makePluginNamespace(pluginName);

// NOTE: const-ed to make the inferred types more specific
const REVERSE_RESOLVER_DATASOURCE_NAMES = [
  DatasourceName.ReverseResolverRoot,
  DatasourceName.ReverseResolverBase,
  // TODO: re-enable the following
  // DatasourceName.ReverseResolverOptimism,
  // DatasourceName.ReverseResolverArbitrum,
  // DatasourceName.ReverseResolverScroll,
  // DatasourceName.ReverseResolverLinea,
] as const;

export default {
  pluginName,
  get config() {
    const deployment = getENSDeployment(config.ensDeploymentChain);
    const datasources = REVERSE_RESOLVER_DATASOURCE_NAMES.map(
      (datasourceName) => deployment[datasourceName],
    );

    return createConfig({
      networks: datasources
        .map((datasource) => datasource.chain)
        .reduce(
          (memo, chain) => ({
            ...memo,
            ...networksConfigForChain(chain.id),
          }),
          {},
        ),
      contracts: {
        ReverseResolver: {
          network: datasources.reduce(
            (memo, datasource) => ({
              ...memo,
              ...networkConfigForContract(
                datasource.chain,
                // treat all contract configs in this ReverseResolver* Datasource as ReverseResolvers
                mergeContractConfigs(Object.values(datasource.contracts)),
              ),
            }),
            {},
          ),
          // NOTE: all Resolvers share the same abi, so just use the first definition
          abi: datasources[0]!.contracts.ReverseResolver.abi,
        },
      },
    });
  },
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: [import("@/plugins/multi-network/ReverseResolver")],
  }),
} as const satisfies ENSIndexerPlugin<PluginName.ReverseResolvers>;
