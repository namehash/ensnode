import type { BlockRefRangeWithStartBlock } from "./blockrange";
import type { BlockRef } from "./blocks";

/**
 * Chain indexing config
 *
 * References config applied when indexing a given chain.
 */
export interface ChainIndexingConfig {
  /**
   * Indexed blockrange for the chain.
   */
  indexedBlockrange: BlockRefRangeWithStartBlock;

  /**
   * Backfill end block for the chain.
   *
   * Applies to chains that are (or will be) in the "historical" indexing state.
   */
  backfillEndBlock: BlockRef | null;
}
