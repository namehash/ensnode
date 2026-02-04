import type { BlockRef } from "./blocks";
import type { ChainId } from "./chains";

/**
 * Ponder Application Settings
 *
 * Represents the application-level settings for Ponder application.
 */
interface PonderApplicationSettings {
  /**
   * Command used to start the Ponder application.
   */
  command: "dev" | "start";

  /**
   * Ordering strategy for onchain data used during indexing.
   */
  ordering: "omnichain";
}

/**
 * Chain Indexing Metrics
 *
 * Represents the indexing metrics for a specific chain indexed by Ponder application.
 *
 * Guarantees:
 * - `indexingCompleted` and `indexingRealtime` cannot both be `true`
 *   at the same time. All other combinations are valid.
 */
interface ChainIndexingMetrics {
  /**
   * Number of blocks required to be synced during backfill.
   *
   * Guarantees:
   * - Is a positive integer.
   */
  backfillSyncBlocksTotal: number;

  /**
   * Latest synced block
   *
   * Corresponds to the latest block stored in the RPC cache for the chain.
   */
  latestSyncedBlock: BlockRef;

  /**
   * Is indexing completed for the chain?
   *
   * This will be true when the backfill has been completed,
   * and a specified end block for the chain has been reached.
   */
  indexingCompleted: boolean;

  /**
   * Is indexing following in real-time for the chain?
   *
   * This will be true when the backfill has been completed,
   * and there was no specified end block for the chain,
   * so indexing continues in real-time.
   */
  indexingRealtime: boolean;
}

/**
 * Ponder Indexing Metrics
 *
 * Represents the overall indexing metrics for the Ponder application,
 * including application settings and per-chain indexing metrics.
 */
export interface PonderIndexingMetrics {
  /**
   * Settings related to how the Ponder application is configured to index onchain data.
   */
  application: PonderApplicationSettings;

  /**
   * Map of indexed chain IDs to their respective indexing metrics.
   *
   * Guarantees:
   * - Includes entry for at least one indexed chain.
   */
  chains: Map<ChainId, ChainIndexingMetrics>;
}
