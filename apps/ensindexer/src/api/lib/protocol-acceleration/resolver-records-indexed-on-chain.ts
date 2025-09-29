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
 * Determines, for a given chain, whether all Resolver Records are indexed.
 *
 * @param chainId - The chain ID to check for resolver record indexing
 * @returns true if resolver records are indexed on the given chain, false otherwise
 */
export function areResolverRecordsIndexedOnChain(chainId: ChainId) {
  const protocolAccelerationPluginEnabled = config.plugins.includes(
    PluginName.ProtocolAcceleration,
  );

  // the ProtocolAcceleration plugin describes ResolverRecord indexing behavior: it must be enabled
  if (!protocolAccelerationPluginEnabled) return false;

  // then, records are available on this chainId iff this chain is indexed by the ProtocolAcceleration
  // plugin

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
