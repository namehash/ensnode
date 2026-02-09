import type { BlockRef } from "./blocks";
import type { ChainId } from "./chains";

/**
 * Ponder Application Commands
 *
 * Represents the commands that can be used to start a Ponder app.
 */
export const PonderAppCommands = {
  Dev: "dev",
  Start: "start",
} as const;

export type PonderAppCommand = (typeof PonderAppCommands)[keyof typeof PonderAppCommands];

/**
 * Ponder Indexing Orderings
 *
 * Represents the indexing ordering strategies supported by Ponder.
 *
 * Note: Support for other Ponder indexing strategies is planned for the future.
 */
export const PonderIndexingOrderings = {
  Omnichain: "omnichain",
} as const;

export type PonderIndexingOrdering =
  (typeof PonderIndexingOrderings)[keyof typeof PonderIndexingOrderings];

/**
 * Ponder Application Settings
 *
 * Represents the application-level settings for a Ponder app.
 */
export interface PonderApplicationSettings {
  /**
   * Command used to start the Ponder application.
   */
  command: PonderAppCommand;

  /**
   * Ordering strategy for onchain data used during indexing.
   */
  ordering: PonderIndexingOrdering;
}

/**
 * Chain Indexing Metrics
 *
 * Represents the indexing metrics for a specific chain indexed by a Ponder app.
 *
 * Guarantees:
 * - `indexingCompleted` and `indexingRealtime` cannot both be `true`
 *   at the same time. All other combinations are valid.
 */
export interface ChainIndexingMetrics {
  /**
   * Number of blocks required to be synced to complete
   * the backfill phase of indexing.
   *
   * This value is calculated by Ponder at the time
   * the backfill starts. It corresponds to the number of blocks between:
   * - the first block to be indexed (specified in Ponder config), and
   * - the last block to be indexed during backfill.
   * The last block to be indexed during backfill is one of:
   * - The specified end block (if any) in the Ponder config, or
   * - The latest known block at the time the backfill started.
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
  appSettings: PonderApplicationSettings;

  /**
   * Map of indexed chain IDs to their respective indexing metrics.
   *
   * Guarantees:
   * - Includes entry for at least one indexed chain.
   */
  chains: Map<ChainId, ChainIndexingMetrics>;
}
