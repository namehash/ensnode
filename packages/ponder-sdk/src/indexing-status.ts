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
   * During indexing, a Ponder app indexes the chain and
   * keeps track of a checkpoint block for each indexed chain.
   *
   * @see https://ponder.sh/docs/api-reference/ponder/database#checkpoint-table
   *
   * The `checkpointBlock` is a reference to either:
   * - the first block to be indexed for the chain (if indexing is queued), or
   * - the last indexed block for the chain (if one or more blocks
   *   have been indexed for the chain).
   */
  checkpointBlock: BlockRef;
}

/**
 * Ponder Indexing Status
 *
 * Represents the indexing status of each chain in a Ponder app.
 */
export interface PonderIndexingStatus {
  /**
   * Map of indexed chain IDs to their chain indexing status.
   *
   * Guarantees:
   * - Includes entry for at least one indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatus>;
}
