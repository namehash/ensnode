import type { ChainId, ENSNamespaceId } from "@ensnode/ensnode-sdk";
import { getDatasourcesWithResolvers } from "@ensnode/ensnode-sdk/internal";

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
  // use same datasources set as the ProtocolAcceleration plugin
  const datasources = getDatasourcesWithResolvers(namespace);
  const chainIds = datasources.map((ds) => ds.chain.id);
  return chainIds.includes(chainId);
}
