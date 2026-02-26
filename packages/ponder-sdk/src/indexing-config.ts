import type { BlockRefRange, BlockRefRangeDefinite, BlockRefRangeIndefinite } from "./blockrange";
import type { BlockRef } from "./blocks";

/**
 * Chain indexing configuration
 *
 * References configuration applied when indexing a given chain.
 */
export interface ChainIndexingConfig {
  /**
   * Indexed block range for the chain.
   *
   * For chains with no configured end block, this will be
   * {@link BlockRefRangeIndefinite}, and otherwise it will be
   * {@link BlockRefRangeDefinite}.
   */
  indexedRange: BlockRefRange;

  /**
   * Backfill end block for the chain.
   *
   * Applies to chains that are (or will be) in the "historical" indexing state.
   */
  backfillEndBlock: BlockRef | null;
}
