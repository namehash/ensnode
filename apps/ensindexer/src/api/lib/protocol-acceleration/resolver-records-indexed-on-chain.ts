import { ChainId, ENSNamespaceId, deserializeChainId } from "@ensnode/ensnode-sdk";

import { DATASOURCES_WITH_RESOLVERS } from "@/lib/protocol-acceleration/datasources-with-resolvers";
import { resolverContractConfig } from "@/lib/resolver-contract-config";

/**
 * Determines, for a given chain, whether Resolver Records are indexed by the ProtocolAcceleration plugin.
 *
 * @param chainId - The chain ID to check for resolver record indexing
 * @returns true if resolver records are indexed on the given chain, false otherwise
 * @dev the caller has the responsibility of checking if the ProtocolAcceleration plugin is enabled
 *   before relying on Resolver Records.
 */
export function areResolverRecordsIndexedByProtocolAccelerationPluginOnChainId(
  namespace: ENSNamespaceId,
  chainId: ChainId,
) {
  // construct a dummy Resolver ContractConfig with the same `datasourceNames` as the ProtocolAcceleration plugin
  const dummyContractConfig = resolverContractConfig(namespace, DATASOURCES_WITH_RESOLVERS, {
    startBlock: 0,
    endBlock: 0,
  });

  // records are available on this chainId iff this chain is included in the Resolver contract config
  // used by the ProtocolAcceleration plugin
  return Object.keys(dummyContractConfig.chain) //
    .map((chainIdString) => deserializeChainId(chainIdString))
    .includes(chainId);
}
