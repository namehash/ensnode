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
 * Chain Indexing States
 *
 * Represents the indexing state of a chain indexed by a Ponder app.
 */
export const ChainIndexingStates = {
  Queued: "queued",
  Backfill: "backfill",
  Completed: "completed",
  Realtime: "realtime",
} as const;

export type ChainIndexingState = (typeof ChainIndexingStates)[keyof typeof ChainIndexingStates];

/**
 * Chain Indexing Metrics Queued
 *
 * Represents the indexing metrics for a chain that has not started
 * indexing yet, and is queued to transition to backfill phase,
 * where it will be indexed by a Ponder app
 */
export interface ChainIndexingMetricsQueued {
  state: typeof ChainIndexingStates.Queued;

  /**
   *
   * Total count of blocks required to be indexed during backfill.
   *
   * Guaranteed to be a positive integer.
   */
  backfillTotalBlocks: number;
}

/**
 * Chain Indexing Metrics Backfill
 *
 * Represents the indexing metrics for a chain that is currently in
 * the backfill phase of indexing by a Ponder app.
 */
export interface ChainIndexingMetricsBackfill {
  state: typeof ChainIndexingStates.Backfill;

  /**
   *
   * Total count of blocks required to be indexed during backfill.
   *
   * Guaranteed to be a positive integer.
   */
  backfillTotalBlocks: number;
}

/**
 * Chain Indexing Metrics Realtime
 *
 * Represents the indexing metrics for a chain that is currently in
 * the realtime indexing phase by a Ponder app. It means that
 * the backfill phase transitioned to realtime phase, as there was
 * no "config end block" specified for the chain.
 *
 * The indexing continues in realtime, with no "target end block".
 * The "latest synced block" is continuously updated as new blocks are
 * discovered by RPCs and stored in the RPC cache.
 */
export interface ChainIndexingMetricsRealtime {
  state: typeof ChainIndexingStates.Realtime;

  /**
   * A {@link BlockRef} to the "highest" block that has been discovered by RPCs
   * and stored in the RPC cache as of the time the metric value was captured.
   */
  latestSyncedBlock: BlockRef;
}

/**
 * Chain Indexing Metrics Completed
 *
 * Represents the indexing metrics for a chain configured to only index
 * a finite range of blocks where all blocks in that finite range
 * have been indexed.
 */
export interface ChainIndexingMetricsCompleted {
  state: typeof ChainIndexingStates.Completed;

  /**
   * Final indexed block
   *
   * A {@link BlockRef} to the final block that was the finite target
   * for indexing the chain. No more blocks will be indexed for the chain
   * after this block.
   */
  finalIndexedBlock: BlockRef;
}

/**
 * Chain Indexing Metrics
 *
 * Represents the indexing metrics for a specific chain indexed by a Ponder app.
 */
export type ChainIndexingMetrics =
  | ChainIndexingMetricsQueued
  | ChainIndexingMetricsBackfill
  | ChainIndexingMetricsCompleted
  | ChainIndexingMetricsRealtime;

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
