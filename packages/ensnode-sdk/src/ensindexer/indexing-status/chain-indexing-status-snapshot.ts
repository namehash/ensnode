import type { BlockRef, ChainId, UnixTimestamp } from "../../shared/types";

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
   *   "true" {@link ChainIndexingStatusSnapshot} for the chain is still being loaded; or
   * - ENSIndexer is using an omnichain indexing strategy and the
   *   `omnichainIndexingCursor` is <= `config.startBlock.timestamp` for the chain's
   *   {@link ChainIndexingStatusSnapshot}.
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
 * Create {@link ChainIndexingConfig} for given block refs.
 *
 * @param startBlock required block ref
 * @param endBlock optional block ref
 */
export function createIndexingConfig(
  startBlock: BlockRef,
  endBlock: BlockRef | null,
): ChainIndexingConfig {
  if (endBlock) {
    return {
      configType: ChainIndexingConfigTypeIds.Definite,
      startBlock,
      endBlock,
    } satisfies ChainIndexingConfigDefinite;
  }

  return {
    configType: ChainIndexingConfigTypeIds.Indefinite,
    startBlock,
  } satisfies ChainIndexingConfigIndefinite;
}

/**
 * Get the timestamp of the lowest `config.startBlock` across all chains
 * in the provided array of {@link ChainIndexingStatusSnapshot}.
 *
 * Such timestamp is useful when presenting the "lowest" block
 * to be indexed across all chains.
 */
export function getTimestampForLowestOmnichainStartBlock(
  chains: ChainIndexingStatusSnapshot[],
): UnixTimestamp {
  const earliestKnownBlockTimestamps: UnixTimestamp[] = chains.map(
    (chain) => chain.config.startBlock.timestamp,
  );

  // Invariant: earliestKnownBlockTimestamps is guaranteed to have at least one element
  if (earliestKnownBlockTimestamps.length === 0) {
    throw new Error(
      "Invariant violation: at least one chain is required to determine the lowest omnichain start block timestamp",
    );
  }

  return Math.min(...earliestKnownBlockTimestamps);
}

/**
 * Get the timestamp of the "highest known block" across all chains
 * in the provided array of {@link ChainIndexingStatusSnapshot}.
 *
 * Such timestamp is useful when presenting the "highest known block"
 * to be indexed across all chains.
 *
 * The "highest known block" for a chain depends on its status:
 * - `config.endBlock` for a "queued" chain (only if the config is `Definite`),
 * - `backfillEndBlock` for a "backfill" chain,
 * - `latestIndexedBlock` for a "completed" chain,
 * - `latestKnownBlock` for a "following" chain.
 */
export function getTimestampForHighestOmnichainKnownBlock(
  chains: ChainIndexingStatusSnapshot[],
): UnixTimestamp {
  const latestKnownBlockTimestamps: UnixTimestamp[] = [];

  for (const chain of chains) {
    switch (chain.chainStatus) {
      case ChainIndexingStatusIds.Queued:
        if (chain.config.configType === ChainIndexingConfigTypeIds.Definite) {
          latestKnownBlockTimestamps.push(chain.config.endBlock.timestamp);
        }
        break;

      case ChainIndexingStatusIds.Backfill:
        latestKnownBlockTimestamps.push(chain.backfillEndBlock.timestamp);

        break;

      case ChainIndexingStatusIds.Completed:
        latestKnownBlockTimestamps.push(chain.latestIndexedBlock.timestamp);
        break;

      case ChainIndexingStatusIds.Following:
        latestKnownBlockTimestamps.push(chain.latestKnownBlock.timestamp);
        break;
    }
  }

  // Invariant: at least one chain must contribute a known block timestamp
  // (e.g., Queued chains with Indefinite config do not contribute)
  if (latestKnownBlockTimestamps.length === 0) {
    throw new Error(
      "Invariant: at least one chain must contribute a known block timestamp to determine the highest omnichain known block timestamp",
    );
  }

  return Math.max(...latestKnownBlockTimestamps);
}

/**
 * Sort a list of [{@link ChainId}, {@link ChainIndexingStatusSnapshot}] tuples
 * by the omnichain start block timestamp in ascending order.
 */
export function sortChainStatusesByStartBlockAsc<
  ChainStatusType extends ChainIndexingStatusSnapshot,
>(chains: [ChainId, ChainStatusType][]): [ChainId, ChainStatusType][] {
  // Sort the chain statuses by the omnichain first block to index timestamp
  return [...chains].sort(
    ([, chainA], [, chainB]) =>
      chainA.config.startBlock.timestamp - chainB.config.startBlock.timestamp,
  );
}
