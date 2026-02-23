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
  const result = new Map<ChainId, PublicClient>();

  for (const [chainId, publicClient] of Object.entries(ponderPublicClients)) {
    result.set(deserializeChainId(chainId), publicClient);
  }

  return result;
}
