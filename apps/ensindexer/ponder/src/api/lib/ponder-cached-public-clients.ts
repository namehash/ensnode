import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId } from "@ensnode/ensnode-sdk";
import type { ChainId } from "@ensnode/ponder-sdk";

import { filterPonderAppMetadataMap } from "./filter-ponder-app-metadata-map";

/**
 * Builds a map of cached public clients for each indexed chain,
 * based on the Ponder public clients.
 *
 * Invariants:
 * - all chain IDs in the Ponder public clients can be deserialized,
 * - all indexed chains have a corresponding cached public client.
 *
 * @throws Error if any of the above invariants are violated.
 */
export function buildPonderCachedPublicClients(): Map<ChainId, PublicClient> {
  const ponderCachedPublicClients = new Map<ChainId, PublicClient>();

  for (const [chainId, publicClient] of Object.entries(ponderPublicClients)) {
    ponderCachedPublicClients.set(deserializeChainId(chainId), publicClient);
  }

  return filterPonderAppMetadataMap(ponderCachedPublicClients);
}
