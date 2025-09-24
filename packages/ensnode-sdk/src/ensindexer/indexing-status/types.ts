import type { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";

export const ChainIndexingStatusIds = {
  Queued: "chain-queued",
  Backfill: "chain-backfill",
  Following: "chain-following",
  Completed: "chain-completed",
} as const;

/**
 * ChainIndexingStatusId is the derived string union of possible Chain Indexing Status identifiers.
 */
export type ChainIndexingStatusId =
  (typeof ChainIndexingStatusIds)[keyof typeof ChainIndexingStatusIds];

export const OmnichainIndexingStatusIds = {
  Unstarted: "omnichain-unstarted",
  Backfill: "omnichain-backfill",
  Following: "omnichain-following",
  Completed: "omnichain-completed",
} as const;

/**
 * OmnichainIndexingStatusId is the derived string union of possible Omnichain Indexing Status identifiers.
 */
export type OmnichainIndexingStatusId =
  (typeof OmnichainIndexingStatusIds)[keyof typeof OmnichainIndexingStatusIds];

export const ChainIndexingConfigTypeIds = {
  Indefinite: "indefinite",
  Definite: "definite",
} as const;

/**
 * ChainIndexingConfigTypeIds is the derived string union of possible Chain Indexing Config Type identifiers.
 */
export type ChainIndexingConfigTypeId =
  (typeof ChainIndexingConfigTypeIds)[keyof typeof ChainIndexingConfigTypeIds];

/**
 * Chain Indexing Config Indefinite
 *
 * Configures a chain to be indexed for an indefinite range.
 */
export interface ChainIndexingConfigIndefinite {
  /**
   * Chain indexing config type.
   */
  type: typeof ChainIndexingConfigTypeIds.Indefinite;

  /**
   * The block where indexing of the chain starts.
   *
   * An indexed chain always has its `startBlock` defined.
   */
  startBlock: BlockRef;

  /**
   * Indefinite chain indexing configs always have a null `endBlock`.
   */
  // TODO: Remove the `?` and make this field required to be `null`.
  endBlock?: null;
}

/**
 * Chain Indexing Config Definite
 *
 * Configures a chain to be indexed for a definite range.
 *
 * Invariants:
 * - `startBlock` is always before or the same as `endBlock`
 */
export interface ChainIndexingConfigDefinite {
  /**
   * Chain indexing config type.
   */
  type: typeof ChainIndexingConfigTypeIds.Definite;

  /**
   * The block where indexing of the chain starts.
   *
   * `startBlock` must always be defined.
   */
  startBlock: BlockRef;

  /**
   * The block where indexing of the chain ends.
   *
   * Definite chain indexing configs always have a defined `endBlock`.
   */
  endBlock: BlockRef;
}

/**
 * Chain Indexing Config
 *
 * Configuration of an indexed chain.
 */
export type ChainIndexingConfig = ChainIndexingConfigIndefinite | ChainIndexingConfigDefinite;

/**
 * Chain Indexing Snapshot: Queued
 *
 * Notes:
 * - The "queued" status applies when using omnichain ordering and
 *   the omnichainIndexingCursor from the overall indexing status <= config.startBlock.timestamp.
 */
export interface ChainIndexingSnapshotQueued {
  status: typeof ChainIndexingStatusIds.Queued;
  config: ChainIndexingConfig;
}

/**
 * Chain Indexing Snapshot: Backfill
 *
 * During a backfill, special performance optimizations are applied to
 * index all blocks between config.startBlock and backfillEndBlock
 * as fast as possible.
 *
 * Notes:
 * - The backfillEndBlock is either config.endBlock (if present) or
 *   the latest block on the chain when the ENSIndexer process started up.
 *   Note how this means the backfillEndBlock is always a "fixed target".
 * - When latestIndexedBlock reaches backfillEndBlock, the backfill is complete.
 *   The moment backfill is complete the status does not immediately transition.
 *   Instead, internal processing is completed for a period of time while
 *   the status remains "backfill". After this internal processing is completed
 *   the status will change to "following" or "completed" depending on
 *   the configured indexing config type. If the config type is indefinite,
 *   changes to "following", else if the config type is definite, changes to
 *   "completed".
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `backfillEndBlock`
 * - `backfillEndBlock` is the same as `config.endBlock` if and only if
 *   the config is definite.
 */
export interface ChainIndexingSnapshotBackfill {
  status: typeof ChainIndexingStatusIds.Backfill;
  config: ChainIndexingConfig;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;

  /**
   * The block that is the target for finishing the backfill.
   */
  backfillEndBlock: BlockRef;
}

/**
 * Chain Indexing Snapshot: Following
 *
 * Following occurs after the backfill of a chain is completed and represents
 * the process of indefinitely following (and indexing!) new blocks as they are
 * added to the indexed chain across time.
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `latestKnownBlock`
 */
export interface ChainIndexingSnapshotFollowing {
  status: typeof ChainIndexingStatusIds.Following;

  config: ChainIndexingConfigIndefinite;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;

  /**
   * The "highest" block that has been fetched by RPC calls and stored in
   * the RPC cache as part of the indexing process.
   */
  latestKnownBlock: BlockRef;
}

/**
 * Chain Indexing Snapshot: Completed
 *
 * Indexing of a chain is completed after the backfill when the chain is
 * not configured to be indefinitely indexed.
 *
 * Invariants:
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always the same as `config.endBlock`.
 */
export interface ChainIndexingSnapshotCompleted {
  status: typeof ChainIndexingStatusIds.Completed;
  config: ChainIndexingConfigDefinite;

  /**
   * The block that was most recently indexed.
   */
  latestIndexedBlock: BlockRef;
}

/**
 * Chain Indexing Snapshot
 *
 * Use the `status` field to determine the correct snapshot type interpretation
 * at runtime.
 */
export type ChainIndexingSnapshot =
  | ChainIndexingSnapshotQueued
  | ChainIndexingSnapshotBackfill
  | ChainIndexingSnapshotFollowing
  | ChainIndexingSnapshotCompleted;

/**
 * Omnichain Indexing Snapshot: Unstarted
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the omnichain status is {@link OmnichainIndexingStatusIds.Unstarted}.
 */
export interface OmnichainIndexingSnapshotUnstarted {
  /**
   * Omnichain Indexing Status
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Unstarted;

  /**
   * Indexing Snapshot for each chain.
   *
   * Each chain is guaranteed to have the "queued" status.
   * It's impossible for any chain to have status other than "queued".
   */
  chains: Map<ChainId, ChainIndexingSnapshotQueued>;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the lowest start block timestamp of all queued chains - 1.
   */
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Snapshot Time
   *
   * The value in this field represents the timestamp when the snapshot was generated.
   *
   * Invariants:
   * - `snapshotTime` is >= `omnichainIndexingCursor`
   * - for any chain with status "following", `snapshotTime` is >= `latestKnownBlock.timestamp`
   *
   * Due to possible clock skew between systems, when generating the value that you put in this field,
   * it should be set as the max between the system timestamp in ENSIndexer and `omnichainIndexingCursor`
   * and `latestKnownBlock.timestamp`.
   *
   * Goals of this field include helping to identify the distinction between the "current" distance vs
   * the "snapshot" distance. This is highly relevant for cases where "snapshots" are planned to be cached
   * in memory or stored in ENSDb.
   */
  snapshotTime: UnixTimestamp;
}

/**
 * Chain Indexing Snapshot allowed when overall status is 'backfill'.
 */
export type ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill =
  | ChainIndexingSnapshotQueued
  | ChainIndexingSnapshotBackfill
  | ChainIndexingSnapshotCompleted;

/**
 * Omnichain Indexing Snapshot: Backfill
 *
 * Describes the current state of indexing operations across all indexed chains
 * when the omnichain status is {@link OmnichainIndexingStatusIds.Backfill}.
 */
export interface OmnichainIndexingSnapshotBackfill {
  /**
   * Omnichain Indexing Status
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Backfill;

  /**
   * Indexing Snapshot for each chain.
   *
   * At least one chain is guaranteed to be in the "backfill" status.
   * Each chain is guaranteed to have a status of either "queued",
   * "backfill" or "completed". It's impossible for any chain to be
   * in the "following" status.
   */
  chains: Map<ChainId, ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill>;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all indexed chains.
   *
   * Invariants:
   * - guaranteed to be equal to
   *   the timestamp of the highest `latestIndexedBlock` across all chains that
   *   have started indexing (are not queued).
   * - guaranteed to be lower than
   *   the `config.startBlock` timestamp for all queued chains.
   */
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Snapshot Time
   *
   * The value in this field represents the timestamp when the snapshot was generated.
   *
   * Invariants:
   * - `snapshotTime` is >= `omnichainIndexingCursor`
   * - for any chain with status "following", `snapshotTime` is >= `latestKnownBlock.timestamp`
   *
   * Due to possible clock skew between systems, when generating the value that you put in this field,
   * it should be set as the max between the system timestamp in ENSIndexer and `omnichainIndexingCursor`
   * and `latestKnownBlock.timestamp`.
   *
   * Goals of this field include helping to identify the distinction between the "current" distance vs
   * the "snapshot" distance. This is highly relevant for cases where "snapshots" are planned to be cached
   * in memory or stored in ENSDb.
   */
  snapshotTime: UnixTimestamp;
}

/**
 * Omnichain Indexing Snapshot: Following
 *
 * Describes the state when the omnichain status is
 * {@link OmnichainIndexingStatusIds.Following}.
 */
export interface OmnichainIndexingSnapshotFollowing {
  /**
   * Omnichain Indexing Status
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Following;

  /**
   * Indexing Status for each chain.
   *
   * At least one chain is guaranteed to be in the "following" status.
   * Each chain is guaranteed to have a status of either "queued",
   * "backfill", "following" or "completed".
   */
  chains: Map<ChainId, ChainIndexingSnapshot>;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all indexed chains.
   *
   * Invariants:
   * - guaranteed to be equal to
   *   the timestamp of the highest `latestIndexedBlock` across all chains that
   *   have started indexing (are not queued).
   * - guaranteed to be lower than
   *   the `config.startBlock` timestamp for all queued chains.
   */
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Snapshot Time
   *
   * The value in this field represents the timestamp when the snapshot was generated.
   *
   * Invariants:
   * - `snapshotTime` is >= `omnichainIndexingCursor`
   * - for any chain with status "following", `snapshotTime` is >= `latestKnownBlock.timestamp`
   *
   * Due to possible clock skew between systems, when generating the value that you put in this field,
   * it should be set as the max between the system timestamp in ENSIndexer and `omnichainIndexingCursor`
   * and `latestKnownBlock.timestamp`.
   *
   * Goals of this field include helping to identify the distinction between the "current" distance vs
   * the "snapshot" distance. This is highly relevant for cases where "snapshots" are planned to be cached
   * in memory or stored in ENSDb.
   */
  snapshotTime: UnixTimestamp;
}

/**
 * Omnichain Indexing Snapshot: Completed
 *
 * Describes the final state of indexing operations across all indexed chains
 * when all indexed chains have definite indexing config and
 * all indexing of that definite range is completed.
 */
export interface OmnichainIndexingSnapshotCompleted {
  /**
   * Overall Indexing Status
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Completed;

  /**
   * Indexing Status for each chain.
   *
   * Each chain is guaranteed to have the "completed" status.
   * It's impossible for any chain to have status other than "completed".
   */
  chains: Map<ChainId, ChainIndexingSnapshotCompleted>;

  /**
   * Omnichain Indexing Cursor
   *
   * Identifies the timestamp of the progress of omnichain indexing across
   * all indexed chains.
   *
   * Invariants:
   * - guaranteed to be equal to
   *   the timestamp of the highest `latestIndexedBlock` across all chains that
   *   have started indexing (are not queued).
   * - guaranteed to be lower than
   *   the `config.startBlock` timestamp for all queued chains.
   */
  omnichainIndexingCursor: UnixTimestamp;

  /**
   * Snapshot Time
   *
   * The value in this field represents the timestamp when the snapshot was generated.
   *
   * Invariants:
   * - `snapshotTime` is >= `omnichainIndexingCursor`
   * - for any chain with status "following", `snapshotTime` is >= `latestKnownBlock.timestamp`
   *
   * Due to possible clock skew between systems, when generating the value that you put in this field,
   * it should be set as the max between the system timestamp in ENSIndexer and `omnichainIndexingCursor`
   * and `latestKnownBlock.timestamp`.
   *
   * Goals of this field include helping to identify the distinction between the "current" distance vs
   * the "snapshot" distance. This is highly relevant for cases where "snapshots" are planned to be cached
   * in memory or stored in ENSDb.
   */
  snapshotTime: UnixTimestamp;
}

/**
 * Omnichain Indexing Snapshot
 *
 * Describes the omnichain snapshot of indexing operations.
 */
export type OmnichainIndexingSnapshot =
  | OmnichainIndexingSnapshotUnstarted
  | OmnichainIndexingSnapshotBackfill
  | OmnichainIndexingSnapshotCompleted
  | OmnichainIndexingSnapshotFollowing;

export const IndexingStrategyIds = {
  Omnichain: "omnichain",
} as const;

export type IndexingStrategyIds = (typeof IndexingStrategyIds)[keyof typeof IndexingStrategyIds];

// NOTE:
// - This is "Current..." because it isthe only place in the indexing status data model that should have a relationship with "now".
// - This adds an explicit "realtime" timestamp
// - The above is important as we want to be able to cache `OmnichainIndexingSnapshot` and then generate
//   - `CurrentIndexingProjectionOmnichain` as a function of:
//      - An omnichain indexing snapshot (from cache)
//      - "now" (aka "realtime")
//      - `maxRealtimeDistance` (as might be associated the request being processed)
// - This also includes an explicit field for `strategy` which provides more "future-proofing" and explicitly
//   identifies how this data model is specific to omnichain indexing -- the data model and invariants would be
//   different for other indexing strategies.
export type CurrentIndexingProjectionOmnichain = {
  type: typeof IndexingStrategyIds.Omnichain;

  // the timestamp approximating "realtime" that relative distances are calculated from
  // must always be >= `snapshotTime`
  // due to possible clock skew between systems, when generating the value that you put in this field,
  // it should be set as the max between the system timestamp in ENSIndexer and `snapshotTime`.
  realtime: UnixTimestamp;

  /**
   * The distance between "now" and the minimum
   * {@link ChainIndexingSnapshot.omnichainIndexingCursor} value
   * across all omnichain statuses.
   */
  // TODO: Update the docs for this field. Previously this field only existed for the "following" omnichain status. It should exist for all omnichain statuses.
  // TODO: Rename to `maxRealtimeDistance`.
  maxRealtimeDistance: Duration;

  snapshot: OmnichainIndexingSnapshot;
};

export type CurrentIndexingProjectionUnavailable = {
  // strategy is unknown because indexer is unavailable
  type: null;

  // the timestamp for "realtime" that relative distances are calculated from
  realtime: UnixTimestamp;

  // maxRealtimeDistance is unknown because indexer is unavailable
  maxRealtimeDistance: null;

  // snapshot is unknown because indexer is unavailable
  snapshot: null;
};

export type CurrentIndexingProjection =
  | CurrentIndexingProjectionOmnichain
  | CurrentIndexingProjectionUnavailable;
