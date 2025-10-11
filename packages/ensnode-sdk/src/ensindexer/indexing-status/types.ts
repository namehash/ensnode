import type { BlockRef, ChainId, Duration, UnixTimestamp } from "../../shared";

/**
 * The type of indexing configuration for a chain.
 */
export const ChainIndexingConfigTypeIds = {
  /**
   * Represents that indexing of the chain should be performed for an indefinite range.
   */
  Indefinite: "indefinite",

  /**
   * Represents that indexing of the chain should be performed for a definite range.
   */
  Definite: "definite",
} as const;

/**
 * The derived string union of possible {@link ChainIndexingConfigTypeIds}.
 */
export type ChainIndexingConfigTypeId =
  (typeof ChainIndexingConfigTypeIds)[keyof typeof ChainIndexingConfigTypeIds];

/**
 * Chain indexing config for a chain whose indexing config `configType` is
 * {@link ChainIndexingConfigTypeIds.Indefinite}.
 *
 * Invariants:
 * - `configType` is always `ChainIndexingConfigTypeIds.Indefinite`.
 */
export interface ChainIndexingConfigIndefinite {
  /**
   * The type of chain indexing config.
   */
  configType: typeof ChainIndexingConfigTypeIds.Indefinite;

  /**
   * A {@link BlockRef} to the block where indexing of the chain should start.
   */
  startBlock: BlockRef;

  /**
   * A {@link BlockRef} to the block where indexing of the chain should end.
   */
  endBlock?: null;
}

/**
 * Chain indexing config for a chain whose indexing config `configType` is
 * {@link ChainIndexingConfigTypeIds.Definite}.
 *
 * Invariants:
 * - `configType` is always `ChainIndexingConfigTypeIds.Definite`.
 * - `startBlock` is always before or the same as `endBlock`.
 */
export interface ChainIndexingConfigDefinite {
  /**
   * The type of chain indexing config.
   */
  configType: typeof ChainIndexingConfigTypeIds.Definite;

  /**
   * A {@link BlockRef} to the block where indexing of the chain should start.
   */
  startBlock: BlockRef;

  /**
   * A {@link BlockRef} to the block where indexing of the chain should end.
   */
  endBlock: BlockRef;
}

/**
 * Indexing configuration for a chain.
 *
 * Use the `configType` field to determine the specific type interpretation
 * at runtime.
 */
export type ChainIndexingConfig = ChainIndexingConfigIndefinite | ChainIndexingConfigDefinite;

/**
 * The status of indexing a chain at the time an indexing status snapshot
 * is captured.
 */
export const ChainIndexingStatusIds = {
  /**
   * Represents that indexing of the chain is not ready to begin yet because:
   * - ENSIndexer is in its initialization phase and the data to build a
   *   "true" {@link ChainIndexingSnapshot} for the chain is still being loaded; or
   * - ENSIndexer is using an omnichain indexing strategy and the
   *   `omnichainIndexingCursor` is <= `config.startBlock.timestamp` for the chain's
   *   {@link ChainIndexingSnapshot}.
   */
  Queued: "chain-queued",

  /**
   * Represents that indexing of the chain is in progress and under a special
   * "backfill" phase that optimizes for accelerated indexing until reaching the
   * "fixed target" `backfillEndBlock`.
   */
  Backfill: "chain-backfill",

  /**
   * Represents that the "backfill" phase of indexing the chain is completed
   * and that the chain is configured to be indexed for an indefinite range.
   * Therefore, indexing of the chain remains indefinitely in progress where
   * ENSIndexer will continuously work to discover and index new blocks as they
   * are added to the chain across time.
   */
  Following: "chain-following",

  /**
   * Represents that indexing of the chain is completed as the chain is configured
   * to be indexed for a definite range and the indexing of all blocks through
   * that definite range is completed.
   */
  Completed: "chain-completed",
} as const;

/**
 * The derived string union of possible {@link ChainIndexingStatusIds}.
 */
export type ChainIndexingStatusId =
  (typeof ChainIndexingStatusIds)[keyof typeof ChainIndexingStatusIds];

/**
 * Chain indexing status snapshot for a chain whose `chainStatus` is
 * {@link ChainIndexingStatusIds.Queued}.
 *
 * Invariants:
 * - `chainStatus` is always {@link ChainIndexingStatusIds.Queued}.
 */
export interface ChainIndexingStatusSnapshotQueued {
  /**
   * The status of indexing the chain at the time the indexing status snapshot
   * was captured.
   */
  chainStatus: typeof ChainIndexingStatusIds.Queued;

  /**
   * The indexing configuration of the chain.
   */
  config: ChainIndexingConfig;
}

/**
 * Chain indexing status snapshot for a chain whose `chainStatus` is
 * {@link ChainIndexingStatusIds.Backfill}.
 *
 * During a backfill, special performance optimizations are applied to
 * index all blocks between `config.startBlock` and `backfillEndBlock`
 * as fast as possible.
 *
 * Note how `backfillEndBlock` is a "fixed target" that does not change during
 * the lifetime of an ENSIndexer process instance:
 * - If the `config` is {@link ChainIndexingConfigDefinite}:
 *   `backfillEndBlock` is always the same as `config.endBlock`.
 * - If the `config` is {@link ChainIndexingConfigIndefinite}:
 *   `backfillEndBlock` is a {@link BlockRef} to what was the latest block on the
 *    chain when the ENSIndexer process was performing its initialization. Note how
 *    this means that if the backfill process takes X hours to complete, because the
 *    `backfillEndBlock` is a "fixed target", when `chainStatus` transitions to
 *    {@link ChainIndexingStatusIds.Following} the chain will be X hours behind
 *    "realtime" indexing.
 *
 * When `latestIndexedBlock` reaches `backfillEndBlock` the backfill is complete.
 * The moment backfill is complete the `chainStatus` may not immediately transition.
 * Instead, internal processing is completed for a period of time while
 * `chainStatus` remains {@link ChainIndexingStatusIds.Backfill}. After this internal
 * processing is completed `chainStatus` will transition:
 * - to {@link ChainIndexingStatusIds.Following} if the `config` is
 *   {@link ChainIndexingConfigIndefinite}.
 * - to {@link ChainIndexingStatusIds.Completed} if the `config` is
 *   {@link ChainIndexingConfigDefinite}.
 *
 * Invariants:
 * - `chainStatus` is always {@link ChainIndexingStatusIds.Backfill}.
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `config.endBlock` is always the same as `backfillEndBlock` if and only if
 *   the config is {@link ChainIndexingConfigDefinite}.
 * - `latestIndexedBlock` is always before or the same as `backfillEndBlock`
 */
export interface ChainIndexingStatusSnapshotBackfill {
  /**
   * The status of indexing the chain at the time the indexing status snapshot
   * was captured.
   */
  chainStatus: typeof ChainIndexingStatusIds.Backfill;

  /**
   * The indexing configuration of the chain.
   */
  config: ChainIndexingConfig;

  /**
   * A {@link BlockRef} to the block that was most recently indexed as of the time the
   * indexing status snapshot was captured.
   */
  latestIndexedBlock: BlockRef;

  /**
   * A {@link BlockRef} to the block where the backfill will end.
   */
  backfillEndBlock: BlockRef;
}

/**
 * Chain indexing status snapshot for a chain whose `chainStatus` is
 * {@link ChainIndexingStatusIds.Following}.
 *
 * Invariants:
 * - `chainStatus` is always {@link ChainIndexingStatusIds.Following}.
 * - `config` is always {@link ChainIndexingConfigIndefinite}
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always before or the same as `latestKnownBlock`
 */
export interface ChainIndexingStatusSnapshotFollowing {
  /**
   * The status of indexing the chain at the time the indexing status snapshot
   * was captured.
   */
  chainStatus: typeof ChainIndexingStatusIds.Following;

  /**
   * The indexing configuration of the chain.
   */
  config: ChainIndexingConfigIndefinite;

  /**
   * A {@link BlockRef} to the block that was most recently indexed as of the time the
   * indexing status snapshot was captured.
   */
  latestIndexedBlock: BlockRef;

  /**
   * A {@link BlockRef} to the "highest" block that has been discovered by RPCs
   * and stored in the RPC cache as of the time the indexing status snapshot was
   * captured.
   */
  latestKnownBlock: BlockRef;
}

/**
 * Chain indexing status snapshot for a chain whose `chainStatus` is
 * {@link ChainIndexingStatusIds.Completed}.
 *
 * After the backfill of a chain is completed, if the chain was configured
 * to be indexed for a definite range, the chain indexing status will transition to
 * {@link ChainIndexingStatusIds.Completed}.
 *
 * Invariants:
 * - `chainStatus` is always {@link ChainIndexingStatusIds.Completed}.
 * - `config` is always {@link ChainIndexingConfigDefinite}
 * - `config.startBlock` is always before or the same as `latestIndexedBlock`
 * - `latestIndexedBlock` is always the same as `config.endBlock`.
 */
export interface ChainIndexingStatusSnapshotCompleted {
  /**
   * The status of indexing the chain at the time the indexing status snapshot
   * was captured.
   */
  chainStatus: typeof ChainIndexingStatusIds.Completed;

  /**
   * The indexing configuration of the chain.
   */
  config: ChainIndexingConfigDefinite;

  /**
   * A {@link BlockRef} to the block that was most recently indexed as of the time the
   * indexing status snapshot was captured.
   */
  latestIndexedBlock: BlockRef;
}

/**
 * Indexing status snapshot for a single chain.
 *
 * Use the `chainStatus` field to determine the specific type interpretation
 * at runtime.
 */
export type ChainIndexingStatusSnapshot =
  | ChainIndexingStatusSnapshotQueued
  | ChainIndexingStatusSnapshotBackfill
  | ChainIndexingStatusSnapshotFollowing
  | ChainIndexingStatusSnapshotCompleted;

/**
 * The status of omnichain indexing at the time an omnichain indexing status
 * snapshot is captured.
 */
export const OmnichainIndexingStatusIds = {
  /**
   * Represents that omnichain indexing is not ready to begin yet because
   * ENSIndexer is in its initialization phase and the data to build a "true"
   * {@link OmnichainIndexingStatusSnapshot} is still being loaded.
   */
  Unstarted: "omnichain-unstarted",

  /**
   * Represents that omnichain indexing is in an overall "backfill" status because
   * - At least one indexed chain has a `chainStatus` of
   *   {@link ChainIndexingStatusIds.Backfill}; and
   * - No indexed chain has a `chainStatus` of {@link ChainIndexingStatusIds.Following}.
   */
  Backfill: "omnichain-backfill",

  /**
   * Represents that omnichain indexing is in an overall "following" status because
   * at least one indexed chain has a `chainStatus` of
   * {@link ChainIndexingStatusIds.Following}.
   */
  Following: "omnichain-following",

  /**
   * Represents that omnichain indexing has completed because all indexed chains have
   * a `chainStatus` of {@link ChainIndexingStatusIds.Completed}.
   */
  Completed: "omnichain-completed",
} as const;

/**
 * The derived string union of possible {@link OmnichainIndexingStatusIds}.
 */
export type OmnichainIndexingStatusId =
  (typeof OmnichainIndexingStatusIds)[keyof typeof OmnichainIndexingStatusIds];

/**
 * Omnichain indexing status snapshot when the overall `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Unstarted}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Unstarted}.
 * - `chains` is always a map to {@link ChainIndexingStatusSnapshotQueued} values exclusively.
 * - `omnichainIndexingCursor` is always < the `config.startBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Queued}.
 */
export interface OmnichainIndexingStatusSnapshotUnstarted {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Unstarted;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshotQueued>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * The range of {@link ChainIndexingSnapshot} types allowed when the
 * overall omnichain indexing status is {@link OmnichainIndexingStatusIds.Backfill}.
 *
 * Note that this is all of the {@link ChainIndexingSnapshot} types with the exception
 * of {@link ChainIndexingStatusSnapshotFollowing}.
 */
export type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill =
  | ChainIndexingStatusSnapshotQueued
  | ChainIndexingStatusSnapshotBackfill
  | ChainIndexingStatusSnapshotCompleted;

/**
 * Omnichain indexing status snapshot when the `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Backfill}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Backfill}.
 * - `chains` is guaranteed to contain at least one chain with a `chainStatus` of
 *   {@link ChainIndexingStatusIds.Backfill}.
 * - `chains` is guaranteed to not to contain any chain with a `chainStatus` of
 *   {@link ChainIndexingStatusIds.Following}
 * - `omnichainIndexingCursor` is always < the `config.startBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Queued}.
 * - `omnichainIndexingCursor` is always <= the `backfillEndBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Backfill}.
 * - `omnichainIndexingCursor` is always >= the `latestIndexedBlock.timestamp` for all
 *    chains with `chainStatus` of {@link ChainIndexingStatusIds.Completed}.
 * - `omnichainIndexingCursor` is always equal to the timestamp of the highest
 *   `latestIndexedBlock` across all chains that have started indexing
 *   (`chainStatus` is not {@link ChainIndexingStatusIds.Queued}).
 */
export interface OmnichainIndexingStatusSnapshotBackfill {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Backfill;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * Omnichain indexing status snapshot when the overall `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Following}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Following}.
 * - `chains` is guaranteed to contain at least one chain with a `status` of
 *   {@link ChainIndexingStatusIds.Following}.
 * - `omnichainIndexingCursor` is always < the `config.startBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Queued}.
 * - `omnichainIndexingCursor` is always <= the `backfillEndBlock.timestamp` for all
 *   chains with `chainStatus` of {@link ChainIndexingStatusIds.Backfill}.
 * - `omnichainIndexingCursor` is always >= the `latestIndexedBlock.timestamp` for all
 *    chains with `chainStatus` of {@link ChainIndexingStatusIds.Completed}.
 * - `omnichainIndexingCursor` is always equal to the timestamp of the highest
 *   `latestIndexedBlock` across all chains that have started indexing
 *   (`chainStatus` is not {@link ChainIndexingStatusIds.Queued}).
 */
export interface OmnichainIndexingStatusSnapshotFollowing {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Following;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshot>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * Omnichain indexing status snapshot when the overall `omnichainStatus` is
 * {@link OmnichainIndexingStatusIds.Completed}.
 *
 * Invariants:
 * - `omnichainStatus` is always {@link OmnichainIndexingStatusIds.Completed}.
 * - `chains` is always a map to {@link ChainIndexingStatusSnapshotCompleted} values exclusively.
 * - `omnichainIndexingCursor` is always equal to the highest
 *   `latestIndexedBlock.timestamp` for all chains.
 */
export interface OmnichainIndexingStatusSnapshotCompleted {
  /**
   * The status of omnichain indexing.
   */
  omnichainStatus: typeof OmnichainIndexingStatusIds.Completed;

  /**
   * The indexing status snapshot for each indexed chain.
   */
  chains: Map<ChainId, ChainIndexingStatusSnapshotCompleted>;

  /**
   * The timestamp of omnichain indexing progress across all indexed chains.
   */
  omnichainIndexingCursor: UnixTimestamp;
}

/**
 * Omnichain indexing status snapshot for one or more chains.
 *
 * Use the `omnichainStatus` field to determine the specific type interpretation
 * at runtime.
 */
export type OmnichainIndexingStatusSnapshot =
  | OmnichainIndexingStatusSnapshotUnstarted
  | OmnichainIndexingStatusSnapshotBackfill
  | OmnichainIndexingStatusSnapshotCompleted
  | OmnichainIndexingStatusSnapshotFollowing;

/**
 * The strategy used for indexing one or more chains.
 *
 * @see https://ponder.sh/docs/api-reference/ponder/config#parameters
 */
export const CrossChainIndexingStrategyIds = {
  /**
   * Represents that the indexing of events across all indexed chains will
   * proceed in a deterministic "omnichain" ordering by block timestamp, chain ID,
   * and block number.
   *
   * This strategy is "deterministic" in that the order of processing cross-chain indexed
   * events and each resulting indexed data state transition recorded in ENSDb is always
   * the same for each ENSIndexer instance operating with an equivalent
   * `ENSIndexerConfig` and ENSIndexer version. However it also has the drawbacks of:
   * - increased indexing latency that must wait for the slowest indexed chain to
   *   add new blocks or to discover new blocks through the configured RPCs.
   * - if any indexed chain gets "stuck" due to chain or RPC failures, all indexed chains
   *   will be affected.
   */
  Omnichain: "omnichain",
} as const;

/**
 * The derived string union of possible {@link CrossChainIndexingStrategyIds}.
 */
export type CrossChainIndexingStrategyId =
  (typeof CrossChainIndexingStrategyIds)[keyof typeof CrossChainIndexingStrategyIds];

/**
 * Cross-chain indexing status snapshot when the `strategy` is
 * {@link CrossChainIndexingStrategyId.Omnichain}.
 *
 * Invariants:
 * - `strategy` is always {@link CrossChainIndexingStrategyId.Omnichain}.
 * - `slowestChainIndexingCursor` is always equal to
 *   `omnichainSnapshot.omnichainIndexingCursor`.
 * - `snapshotTime` is always >= the "highest known block timestamp", defined as the max of:
 *     - the `slowestChainIndexingCursor`.
 *     - the `config.startBlock.timestamp` for all indexed chains.
 *     - the `config.endBlock.timestamp` for all indexed chains with a `config.configType` of
 *       {@link ChainIndexingConfigTypeIds.Definite}.
 *     - the `backfillEndBlock.timestamp` for all chains with `chainStatus` of
 *       {@link ChainIndexingStatusIds.Backfill}.
 *     - the `latestKnownBlock.timestamp` for all chains with `chainStatus` of
 *       {@link ChainIndexingStatusIds.Following}.
 */
export interface CrossChainIndexingStatusSnapshotOmnichain {
  /**
   * The strategy used for indexing one or more chains.
   */
  strategy: typeof CrossChainIndexingStrategyIds.Omnichain;

  /**
   * The timestamp of the "slowest" latest indexed block timestamp
   * across all indexed chains.
   */
  slowestChainIndexingCursor: UnixTimestamp;

  /**
   * The timestamp when the cross-chain indexing status snapshot was generated.
   *
   * Due to possible clock skew between different systems this value must be set
   * to the max of each of the following values to ensure all invariants are followed:
   * - the current system time of the system generating this cross-chain indexing
   *   status snapshot.
   * - the "highest known block timestamp" (see invariants above for full definition).
   */
  snapshotTime: UnixTimestamp;

  /**
   * The omnichain indexing status snapshot for one or more chains.
   */
  omnichainSnapshot: OmnichainIndexingStatusSnapshot;
}

/**
 * Cross-chain indexing status snapshot for one or more chains.
 *
 * Use the `strategy` field to determine the specific type interpretation
 * at runtime.
 *
 * Currently, only omnichain indexing is supported. This type could theoretically
 * be extended to support other cross-chain indexing strategies in the future,
 * such as Ponder's "multichain" indexing strategy that indexes each chain
 * independently without deterministic ordering.
 */
export type CrossChainIndexingStatusSnapshot = CrossChainIndexingStatusSnapshotOmnichain;

/**
 * A "realtime" indexing status projection based on worst-case assumptions
 * from the `snapshot`.
 *
 * Invariants:
 * - `projectedAt` is always >= `snapshot.snapshotTime`.
 * - `worstCaseDistance` is always equal to
 *   `projectedAt - snapshot.slowestChainIndexingCursor`.
 */
export type RealtimeIndexingStatusProjection = {
  /**
   * The timestamp representing "now" as of the time this projection was generated.
   */
  projectedAt: UnixTimestamp;

  /**
   * The distance between `projectedAt` and `snapshot.slowestChainIndexingCursor`.
   *
   * This is "worst-case" because it assumes all of the following:
   * - the `snapshot` (which may have `snapshot.snapshotTime < projectedAt`) is still the
   *   latest snapshot and no indexing progress has been made since `snapshotTime`.
   * - each indexed chain has added a new block as of `projectedAt`.
   */
  worstCaseDistance: Duration;

  /**
   * The {@link CrossChainIndexingStatusSnapshot} that this projection is based on.
   */
  snapshot: CrossChainIndexingStatusSnapshot;
};
