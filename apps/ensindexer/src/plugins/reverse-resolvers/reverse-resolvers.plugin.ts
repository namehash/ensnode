import { createConfig } from "ponder";

import config from "@/config";
import {
  ENSIndexerPlugin,
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * Describes the indexing behavior for every known ENSIP-19 L2 Reverse Resolver.
 */
export const pluginName = PluginName.ReverseResolvers;

// NOTE: namespace unused because we're only indexing multi-network Resolver contracts
const namespace = makePluginNamespace(pluginName);

export const plugin = {
  pluginName,
  get config() {
    const deployment = getENSDeployment(config.ensDeploymentChain);
    const datasources = [
      DatasourceName.ReverseResolverRoot,
      DatasourceName.ReverseResolverBase,
      DatasourceName.ReverseResolverOptimism,
      DatasourceName.ReverseResolverArbitrum,
      DatasourceName.ReverseResolverScroll,
      DatasourceName.ReverseResolverLinea,
    ].map((datasourceName) => deployment[datasourceName]);

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
              ...networkConfigForContract(datasource.chain, datasource.contracts.Resolver),
            }),
            {},
          ),
          // NOTE: all Resolvers share the same abi, so just use the first definition
          abi: datasources[0]!.contracts.Resolver.abi,
        },
      },
    });
  },
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: [import("@/plugins/multi-network/Resolver")],
  }),
} as const satisfies ENSIndexerPlugin<PluginName.ReverseResolvers>;
