import { createConfig } from "ponder";

import { default as appConfig } from "@/config";
import {
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { ContractConfig, DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * Ensures ENSIndexer indexes Resolver contracts on all chains that support ENSIP-19
 * L2 Reverse Records (i.e. `name` and `avatar`).
 */
export const pluginName = PluginName.L2ReverseResolvers;

// NOTE: namespace unused because we're only indexing multi-network Resolver contracts
const namespace = makePluginNamespace(pluginName);

const deployment = getENSDeployment(appConfig.ensDeploymentChain);
const datasources = [
  DatasourceName.ReverseResolverRoot,
  DatasourceName.ReverseResolverBase,
  DatasourceName.ReverseResolverOptimism,
  DatasourceName.ReverseResolverArbitrum,
  DatasourceName.ReverseResolverScroll,
  DatasourceName.ReverseResolverLinea,
].map((datasourceName) => deployment[datasourceName]);

export const config = createConfig({
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
    Resolver: {
      network: datasources.reduce(
        (memo, datasource) => ({
          ...memo,
          ...networkConfigForContract(datasource.chain, {
            // NOTE: we explicitly remove the `address` from the Resolver datasource, as we want to
            // index _every_ Resolver on the specified chains
            // but we include startBlock to constrain indexing appropriately
            startBlock: datasource.contracts.Resolver.startBlock,
          } as ContractConfig),
        }),
        {},
      ),
      // NOTE: all Resolvers share the same abi, so just use the first definition
      abi: datasources[0]!.contracts.Resolver.abi,
    },
  },
});

export const activate = activateHandlers({
  pluginName,
  namespace,
  handlers: [import("../shared/Resolver")],
});
