import type { BlockRef } from "./blocks";
import type { ChainId } from "./chains";

/**
 * Chain Indexing Status
 *
 * Represents the indexing status for a specific chain in a Ponder app.
 */
export interface ChainIndexingStatus {
  /**
   * Checkpoint Block
   *
   * During omnichain indexing, a Ponder app indexes the chain and keeps track of the latest indexed block for each chain.
   * This is represented by the `checkpointBlock` property, which is a reference to either:
   * - the first block to be indexed for the chain (if indexing is queued), or
   * - the last indexed block for the chain (if indexing is in progress).
   */
  checkpointBlock: BlockRef;
}

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
   */
  chains: Map<ChainId, ChainIndexingStatus>;
}
