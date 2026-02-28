import type { BlockRefRangeWithStartBlock } from "@ensnode/ensnode-sdk";
import type { ChainIndexingMetrics, ChainIndexingStatus } from "@ensnode/ponder-sdk";

import type { BackfillScope } from "./backfill-scope";

/**
 * Complete indexing metadata for a single chain.
 *
 * Bundles all data sources describing the chain indexing that are needed to
 * build a ChainIndexingStatusSnapshot:
 * - The configured backfill scope (what blocks we need to index)
 * - Ponder's indexing metrics (current progress/performance)
 * - Ponder's indexing status (checkpoint state)
 */
export interface ChainIndexingMetadata {
  /**
   * Backfill scope for the chain
   *
   * Defines the range of blocks to be indexed during the backfill phase.
   */
  backfillScope: BackfillScope;

  /**
   * Indexing config for the chain
   *
   * Defines the range of blocks to be indexed for the chain.
   */
  indexingConfig: BlockRefRangeWithStartBlock;

  /**
   * Indexing metrics for the chain
   *
   * References current indexing metrics from Ponder Metrics.
   */
  indexingMetrics: ChainIndexingMetrics;

  /**
   * Indexing status for this chain
   *
   * References the checkpoint block from Ponder Status.
   */
  indexingStatus: ChainIndexingStatus;
}
