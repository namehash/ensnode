import config from "@/config";
import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import { ChainId, PluginName } from "@ensnode/ensnode-sdk";

// NOTE: we know ensRoot is defined for all namespaces, so enforce that at runtime with !
const ensRoot = maybeGetDatasource(config.namespace, DatasourceNames.ENSRoot)!;
const basenames = maybeGetDatasource(config.namespace, DatasourceNames.Basenames);
const lineanames = maybeGetDatasource(config.namespace, DatasourceNames.Lineanames);
const threeDNSOptimism = maybeGetDatasource(config.namespace, DatasourceNames.ThreeDNSOptimism);
const threeDNSBase = maybeGetDatasource(config.namespace, DatasourceNames.ThreeDNSBase);

/**
 * Determines, for a given chain, whether all Resolver Record Values are indexed.
 *
 * Returns false immediately if ENSIndexer is in subgraph-compatible mode since resolver record values
 * are not indexed for acceleration in that mode.
 *
 * Otherwise, determines if ENSIndexer has included either:
 *  a. the shared multi-chain `Resolver` handlers (i.e. Subgraph, Basenames, Lineanames), or
 *  b. implements Resolver Record Value indexing for all possible Resolver contracts on
 *     the specified chain (i.e. ThreeDNS).
 *
 * NOTE(shrugs): i don't love how this encodes knowledge from the ponder.config.ts — perhaps we can either
 * import that directly OR abstract it into a `buildENSIndexerPonderConfig` helper that can be
 * re-used within ENSIndexer without worrying about circular dependencies or ponder runtime behavior.
 * Then we could check for the existence of `ponderConfig.contracts.Resolver.chain[chainId]` or
 * `ponderConfig.contracts["threedns/Resolver"].chain[chainId]`.
 *
 * @param chainId - The chain ID to check for resolver record indexing
 * @returns true if resolver records are indexed on the given chain, false otherwise
 */
export function areResolverRecordsIndexedOnChain(chainId: ChainId) {
  // TODO: this will soon be as simple as confirming that the `resolution` plugin is active and
  // that the chainId is in the set of chains indexed by the `resolution` plugin.

  // if config.isSubgraphCompatible, we aren't indexing resolver record values for acceleration
  if (config.isSubgraphCompatible) return false;

  const isENSRootChain = chainId === ensRoot.chain.id;
  const isBasenamesChain = chainId === basenames?.chain.id;
  const isLineanamesChain = chainId === lineanames?.chain.id;
  const isThreeDNSOptimismChain = chainId === threeDNSOptimism?.chain.id;
  const isThreeDNSBaseChain = chainId === threeDNSBase?.chain.id;

  // on the ENS Root Chain, the Subgraph plugin includes multi-chain Resolver indexing behavior
  if (isENSRootChain && config.plugins.includes(PluginName.Subgraph)) {
    return true;
  }

  // on the Basenames chain, the Basenames plugin includes multi-chain Resolver indexing behavior
  if (isBasenamesChain && config.plugins.includes(PluginName.Basenames)) {
    return true;
  }

  // on the Lineanames chain, the Lineanames plugin includes multi-chain Resolver indexing behavior
  if (isLineanamesChain && config.plugins.includes(PluginName.Lineanames)) {
    return true;
  }

  // on the ThreeDNSOptimism chain, the ThreeDNS plugin includes all known Resolver indexing behavior
  if (isThreeDNSOptimismChain && config.plugins.includes(PluginName.ThreeDNS)) {
    return true;
  }

  // on the ThreeDNSBase chain, the ThreeDNS plugin includes all known Resolver indexing behavior
  if (isThreeDNSBaseChain && config.plugins.includes(PluginName.ThreeDNS)) {
    return true;
  }

  // otherwise, we don't have the resolver records on the requested chain
  return false;
}
