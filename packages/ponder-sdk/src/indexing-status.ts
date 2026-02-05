import type { BlockRef } from "./blocks";
import type { ChainId } from "./chains";

/**
 * Ponder Indexing Status
 *
 * Represents the chain indexing status in a Ponder application.
 */
export interface PonderIndexingStatus {
  /**
   * Map of indexed chain IDs to their block reference.
   *
   * Guarantees:
   * - Includes entry for at least one indexed chain.
   * - BlockRef corresponds to either:
   *   - The first block to be indexed (when chain indexing is currently queued).
   *   - The last indexed block (when chain indexing is currently in progress).
   */
  chains: Map<ChainId, BlockRef>;
}
