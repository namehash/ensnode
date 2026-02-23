import config from "@/config";

import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId } from "@ensnode/ensnode-sdk";
import type { ChainId } from "@ensnode/ponder-sdk";

/**
 * Builds a map of chain ID to its configured RPC public client based on
 * the Ponder cached public clients.
 *
 * @throws Error if any chain ID in the cached public clients cannot be
 *         deserialized.
 */
export function buildPonderCachedPublicClients(): Map<ChainId, PublicClient> {
  const ponderCachedPublicClients = new Map<ChainId, PublicClient>();

  for (const [chainId, publicClient] of Object.entries(ponderPublicClients)) {
    ponderCachedPublicClients.set(deserializeChainId(chainId), publicClient);
  }

  const foundChainIds = new Set(ponderCachedPublicClients.keys());
  const indexedChainIds = config.indexedChainIds;

  // Invariant: ponderCachedPublicClients must cover all chains indexed by ENSIndexer
  // config and must not include any chain that is not indexed.
  if (foundChainIds.symmetricDifference(indexedChainIds).size > 0) {
    throw new Error(
      `Ponder cached public clients must be available for all indexed chains. Indexed chain IDs from ENSIndexer config: ${Array.from(config.indexedChainIds).join(", ")}, Chain IDs with cached public clients: ${Array.from(ponderCachedPublicClients.keys()).join(", ")}`,
    );
  }

  return ponderCachedPublicClients;
}
