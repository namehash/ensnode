import config from "@/config";
import { ChainId, PluginName, deserializeChainId } from "@ensnode/ensnode-sdk";

import { DATASOURCES_WITH_RESOLVERS } from "@/lib/protocol-acceleration/datasources-with-resolvers";
import { resolverContractConfig } from "@/lib/resolver-contract-config";

// construct a dummy ContractConfig with the same `datasourceNames` as the ProtocolAcceleration plugin
const DUMMY_CONTRACT_CONFIG = resolverContractConfig(config.namespace, DATASOURCES_WITH_RESOLVERS, {
  startBlock: 0,
  endBlock: 0,
});

// if enabled, Resolver Records are being indexed on the set of chains described by the ContractConfig
const CHAIN_IDS = Object.keys(DUMMY_CONTRACT_CONFIG.chain) //
  .map((chainIdString) => deserializeChainId(chainIdString));

/**
 * Determines, for a given chain, whether Resolver Records are indexed.
 *
 * @param chainId - The chain ID to check for resolver record indexing
 * @returns true if resolver records are indexed on the given chain, false otherwise
 */
export function areResolverRecordsIndexedOnChain(chainId: ChainId) {
  // the ProtocolAcceleration plugin describes ResolverRecord indexing behavior: it must be enabled
  if (!config.plugins.includes(PluginName.ProtocolAcceleration)) return false;

  // if ProtocolAccleration plugin is enabled, records are available on this chainId iff this chain
  // is included in the Resolver contract config used by the ProtocolAcceleration plugin
  return CHAIN_IDS.includes(chainId);
}
