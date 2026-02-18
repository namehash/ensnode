import type { ChainIndexingConfig } from "@ensnode/ensnode-sdk";
import type { ChainIndexingMetrics, ChainIndexingStatus } from "@ensnode/ponder-sdk";

import type { BackfillScope } from "./backfill-scope";

/**
 * Chain Indexing Metadata Fixed
 *
 * Represents the fixed metadata for a chain that is being indexed by a Ponder app. It includes the
 * backfill scope and indexing config for the chain, which are determined at the start of indexing
 * and do not change during the indexing process.
 */
export interface ChainIndexingMetadataFixed {
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
  indexingConfig: ChainIndexingConfig;
}

/**
 * Chain Indexing Metrics Dynamic
 *
 * Represents the dynamic metadata for a chain that is currently being indexed by a Ponder app. It
 * includes the current indexing metrics and indexing status for the chain, which are continuously
 * updated as the chain is indexed.
 */
export interface ChainIndexingMetadataDynamic {
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

/**
 * Complete indexing metadata for a single chain.
 *
 * Combines both the fixed metadata (backfill scope and indexing config) and
 * the dynamic metadata (indexing metrics and indexing status) for
 * a chain that is being indexed by a Ponder app.
 */
export type ChainIndexingMetadata = ChainIndexingMetadataFixed & ChainIndexingMetadataDynamic;
