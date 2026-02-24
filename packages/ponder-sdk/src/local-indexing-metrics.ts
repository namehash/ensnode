import type { BlockNumber } from "./blocks";
import type { ChainId } from "./chains";
import {
  ChainIndexingMetrics,
  type ChainIndexingMetricsCompleted,
  type ChainIndexingMetricsHistorical,
  type ChainIndexingMetricsRealtime,
  type PonderIndexingMetrics,
} from "./indexing-metrics";
import { LocalPonderClient } from "./local-ponder-client";

/**
 * Local Chain Indexing Metrics Historical
 *
 * Extends {@link ChainIndexingMetricsHistorical} with
 * the backfill end block reference.
 */
export interface LocalChainIndexingMetricsHistorical extends ChainIndexingMetricsHistorical {
  /**
   * Backfill end block
   *
   * The block number at which the backfill will end.
   */
  backfillEndBlock: BlockNumber;
}

/**
 * Local Chain Indexing Metrics
 *
 * Extends {@link ChainIndexingMetrics} to include additional relevant
 * information for {@link LocalPonderIndexingMetrics}.
 */
export type LocalChainIndexingMetrics =
  | LocalChainIndexingMetricsHistorical
  | ChainIndexingMetricsCompleted
  | ChainIndexingMetricsRealtime;

/**
 * Local Ponder Indexing Metrics
 *
 * Extends {@link PonderIndexingMetrics} to include additional relevant
 * information for {@link LocalPonderClient}.
 */
export interface LocalPonderIndexingMetrics extends Omit<PonderIndexingMetrics, "chains"> {
  /**
   * Map of indexed chain IDs to their respective indexing metrics.
   *
   * Guarantees:
   * - Includes entry for at least one indexed chain.
   */
  chains: Map<ChainId, LocalChainIndexingMetrics>;
}
