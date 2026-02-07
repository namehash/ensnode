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
 * Chain Indexing Metric Types
 *
 * Represents the different types of indexing states for a chain indexed by
 * a Ponder app.
 */
export const ChainIndexingMetricTypes = {
  Queued: "queued",
  Backfill: "backfill",
  Completed: "completed",
  Realtime: "realtime",
} as const;

export type ChainIndexingMetricType =
  (typeof ChainIndexingMetricTypes)[keyof typeof ChainIndexingMetricTypes];

/**
 * Number of blocks required to be indexed during backfill.
 *
 * References `ponder_historical_total_blocks` Ponder metric..
 *
 * This value is calculated at the time the Ponder app starts,
 * even for each indexed chain.
 *
 * If Ponder config specifies a "config end block" for the chain,
 * the `ponder_historical_total_blocks` will be the number of blocks
 * between the "config start block" and the specified "config end block".
 * For example:
 * ```
 * ponder_historical_total_blocks = configEndBlock - configStartBlock + 1
 * ```
 *
 * If Ponder config does not specify the "config end block" for the chain,
 * the `ponder_historical_total_blocks` will be the number of blocks
 * between the "config start block" and the "latest known block"
 * for the chain at the time the backfill starts.
 * The "latest known block" is the "highest" block that has been
 * discovered by RPCs and stored in the RPC cache as of the time
 * the metric value was captured.
 *
 * Each restart of the Ponder app will result in a new value based on
 * the current "latest known block" for the chain at that time.
 * For example:
 * ```
 * ponder_historical_total_blocks = latestKnownBlock - configStartBlock + 1
 * ```
 *
 * Guaranteed to be a positive integer.
 */
export type BackfillTotalBlocks = number;

/**
 * Chain Indexing Metrics Queued
 *
 * Represents the indexing metrics for a chain that has not started
 * indexing yet, and is queued to transition to backfill phase,
 * where it will be indexed by a Ponder app
 */
export interface ChainIndexingMetricsQueued {
  type: typeof ChainIndexingMetricTypes.Queued;

  /**
   * Total number of blocks to be indexed for the chain during backfill phase.
   */
  backfillTotalBlocks: BackfillTotalBlocks;
}

/**
 * Chain Indexing Metrics Backfill
 *
 * Represents the indexing metrics for a chain that is currently in
 * the backfill phase of indexing by a Ponder app.
 */
export interface ChainIndexingMetricsBackfill {
  type: typeof ChainIndexingMetricTypes.Backfill;

  /**
   * Total number of blocks to be indexed for the chain during backfill phase.
   */
  backfillTotalBlocks: BackfillTotalBlocks;
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
 * The "latest known block" is continuously updated as new blocks are
 * discovered by RPCs and stored in the RPC cache.
 */
export interface ChainIndexingMetricsRealtime {
  type: typeof ChainIndexingMetricTypes.Realtime;

  /**
   * A {@link BlockRef} to the "highest" block that has been discovered by RPCs
   * and stored in the RPC cache as of the time the metric value was captured.
   */
  latestKnownBlock: BlockRef;
}

/**
 * Chain Indexing Metrics Completed
 *
 * Represents the indexing metrics for a chain that has completed indexing by
 * a Ponder app. It means that the backfill phase transitioned to completed phase.
 * No more blocks are required to be indexed for the chain at this point.
 */
export interface ChainIndexingMetricsCompleted {
  type: typeof ChainIndexingMetricTypes.Completed;

  /**
   * Target block
   *
   * A {@link BlockRef} to the block that was the target of the indexing for the chain.
   * There are no more blocks required to be indexed for the chain after this block.
   */
  targetBlock: BlockRef;
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
