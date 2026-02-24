import config from "@/config";

import { publicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId } from "@ensnode/ensnode-sdk";
import { type ChainId, LocalPonderClient } from "@ensnode/ponder-sdk";

import { buildChainsBlockrange } from "@/config/chains-blockrange";

/**
 * Builds a map of cached public clients based the Ponder public clients.
 *
 * Invariants:
 * - all chain IDs in the Ponder public clients can be deserialized,
 *
 * @throws Error if any of the above invariants are violated.
 */
function buildPonderCachedPublicClients(): Map<ChainId, PublicClient> {
  const ponderCachedPublicClients = new Map<ChainId, PublicClient>();

  for (const [chainId, publicClient] of Object.entries(publicClients)) {
    ponderCachedPublicClients.set(deserializeChainId(chainId), publicClient);
  }

  return ponderCachedPublicClients;
}

const chainsBlockrange = buildChainsBlockrange(config.namespace, config.plugins);
const ponderCachedPublicClients = buildPonderCachedPublicClients();

export const localPonderClient = new LocalPonderClient(
  config.ensIndexerUrl,
  config.indexedChainIds,
  chainsBlockrange,
  ponderCachedPublicClients,
);
