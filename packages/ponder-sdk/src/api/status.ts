import type { BlockRef } from "../block-ref";
import type { ChainId } from "../chain";
import type { PonderStatusResponse } from "../ponder-status";

/**
 * Ponder Status for each indexed chain.
 *
 * Guarantees:
 * - Contains status for all indexed chain IDs.
 */
export interface PonderStatus {
  chains: Map<ChainId, BlockRef>;
}

/**
 * Build PonderStatus from validated PonderStatusResponse.
 *
 * @param data Validated PonderStatusResponse.
 * @returns PonderStatus built from the response data.
 */
export function buildPonderStatus(data: PonderStatusResponse): PonderStatus {
  const chains = new Map<ChainId, BlockRef>();

  for (const [, chainData] of Object.entries(data)) {
    chains.set(chainData.id, chainData.block);
  }

  return {
    chains,
  };
}
