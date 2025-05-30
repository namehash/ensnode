import config from "@/config";
import { constrainContractBlockrange } from "@/lib/ponder-helpers";
import { getRequiredDatasourceNames } from "@/plugins";
import { ContractConfig, Datasource, DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { NetworkConfig } from "ponder";
import { http, Chain } from "viem";

/**
 * Get a list of unique datasources for selected plugin names.
 * @param pluginNames
 * @returns
 */
export function getDatasources(pluginNames: PluginName[]): Datasource[] {
  const { ensDeployment } = config;
  const requiredDatasourceNames = getRequiredDatasourceNames(pluginNames);
  const ensDeploymentDatasources = Object.entries(ensDeployment) as Array<
    [DatasourceName, Datasource]
  >;
  const datasources = {} as Record<DatasourceName, Datasource>;

  for (let [datasourceName, datasource] of ensDeploymentDatasources) {
    if (requiredDatasourceNames.includes(datasourceName)) {
      datasources[datasourceName] = datasource;
    }
  }

  return Object.values(datasources);
}

/**
 * Get a list of unique indexed chain IDs for selected plugin names.
 */
export function getIndexedChainIds(pluginNames: PluginName[]): number[] {
  const datasources = getDatasources(pluginNames);
  const indexedChainIds = datasources.map((datasource) => datasource.chain.id);

  return indexedChainIds;
}

/**
 * Builds a ponder#NetworksConfig for a single, specific chain.
 */
export function networksConfigForChain(chainId: number) {
  if (!config.rpcConfigs[chainId]) {
    throw new Error(
      `networksConfigForChain called for chain id ${chainId} but no associated rpcConfig is available in ENSIndexerConfig. rpcConfig specifies the following chain ids: [${Object.keys(config.rpcConfigs).join(", ")}].`,
    );
  }

  const { url, maxRequestsPerSecond } = config.rpcConfigs[chainId]!;

  return {
    [chainId.toString()]: {
      chainId: chainId,
      transport: http(url),
      maxRequestsPerSecond,
      // NOTE: disable cache on local chains (e.g. Anvil, Ganache)
      ...((chainId === 31337 || chainId === 1337) && { disableCache: true }),
    } satisfies NetworkConfig,
  };
}

/**
 * Builds a `ponder#ContractConfig['network']` given a contract's config, constraining the contract's
 * indexing range by the globally configured blockrange.
 */
export function networkConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
  chain: Chain,
  contractConfig: CONTRACT_CONFIG,
) {
  return {
    [chain.id.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      ...constrainContractBlockrange(contractConfig.startBlock), // per-network blockrange
    },
  };
}
