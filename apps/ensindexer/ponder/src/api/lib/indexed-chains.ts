import type { PublicClient } from "viem";

import type { ChainId } from "@ensnode/ponder-sdk";

/**
 * Build a list of indexed chain IDs.
 */
export function buildIndexedChainIds(publicClients: Map<ChainId, PublicClient>): ChainId[] {
  return Array.from(publicClients.keys()) satisfies ChainId[];
}
