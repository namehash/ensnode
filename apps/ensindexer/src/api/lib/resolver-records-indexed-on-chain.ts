import config from "@/config";
import { ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

// NOTE: typing as ENSNamespace so we can access possibly undefined Datasources
const ensNamespace = getENSNamespace(config.namespace) as ENSNamespace;

/**
 * Determines whether, for a given chain, all Resolver Record Values are indexed.
 *
 * NOTE: i don't love how this encodes knowledge from the ponder.config.ts — perhaps we can either
 * import that directly OR abstract it into a `buildENSIndexerPonderConfig` helper that can be
 * re-used within ENSIndexer without worrying about circular dependencies or ponder runtime behavior
 *
 * @param chainId
 * @returns
 */
export function areResolverRecordsAreIndexedOnChain(chainId: number) {
  // config.indexAdditionalResolverRecords must be true, or we aren't indexing resolver records at all
  if (!config.indexAdditionalResolverRecords) return false;

  const isENSRootChain = chainId === ensNamespace.ensroot.chain.id;
  const isBasenamesChain = chainId === ensNamespace.basenames?.chain.id;
  const isLineanamesChain = chainId === ensNamespace.lineanames?.chain.id;
  const isThreeDNSOptimismChain = chainId === ensNamespace["threedns-optimism"]?.chain.id;
  const isThreeDNSBaseChain = chainId === ensNamespace["threedns-base"]?.chain.id;

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
