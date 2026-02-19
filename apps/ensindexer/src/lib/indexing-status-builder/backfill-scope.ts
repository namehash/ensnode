import type { BlockRef } from "@ensnode/ponder-sdk";

/**
 * Backfill scope for a chain.
 *
 * Defines the range of blocks to be indexed during the backfill phase.
 * The backfill phase progresses from `startBlock` toward `endBlock`, and ends
 * when the indexed block reaches `endBlock`.
 */
export interface BackfillScope {
  /**
   * The starting block of the backfill range (inclusive).
   * This is derived from the chain's indexing configuration.
   */
  startBlock: BlockRef;

  /**
   * The ending block of the backfill range (inclusive).
   * This is the "fixed target" that backfill progresses toward.
   *
   * Guaranteed to be greater than `startBlock`.
   */
  endBlock: BlockRef;
}
