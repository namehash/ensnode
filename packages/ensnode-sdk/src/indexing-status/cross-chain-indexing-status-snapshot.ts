import type { ChainId } from "enssdk";

import { RangeTypeIds } from "../shared/blockrange";
import type { BlockRef, UnixTimestamp } from "../shared/types";
import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
} from "./chain-indexing-status-snapshot";
import type { OmnichainIndexingStatusSnapshot } from "./omnichain-indexing-status-snapshot";
import { validateCrossChainIndexingStatusSnapshot } from "./validate/cross-chain-indexing-status-snapshot";

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
 *     - the `config.endBlock.timestamp` for all indexed chains with a `config.rangeType` of
 *       {@link RangeTypeIds.Bounded}.
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
 * Gets the latest indexed {@link BlockRef} for the given {@link ChainId}.
 *
 * @returns the latest indexed {@link BlockRef} for the given {@link ChainId}, or null if the chain
 *          isn't being indexed at all or is queued and therefore hasn't started indexing yet.
 */
export function getLatestIndexedBlockRef(
  indexingStatus: CrossChainIndexingStatusSnapshot,
  chainId: ChainId,
): BlockRef | null {
  const chainIndexingStatus = indexingStatus.omnichainSnapshot.chains.get(chainId);

  if (chainIndexingStatus === undefined) {
    // chain isn't being indexed at all
    return null;
  }

  if (chainIndexingStatus.chainStatus === ChainIndexingStatusIds.Queued) {
    // chain is queued, so no data for the chain has been indexed yet
    return null;
  }

  return chainIndexingStatus.latestIndexedBlock;
}

/**
 * Get the "highest known block timestamp" from chain indexing status snapshots.
 *
 * Returns the maximum timestamp referenced anywhere in the provided chain snapshots,
 * across all of:
 * - `config.startBlock` timestamps for all chains
 * - `config.endBlock` timestamps for bounded chains
 * - `backfillEndBlock` timestamps for chains in backfill status
 * - `latestKnownBlock` timestamps for chains in following status
 *
 * This is used to enforce the invariant that `snapshotTime` must be >= all
 * referenced block timestamps. It differs from {@link getTimestampForHighestOmnichainKnownBlock},
 * which computes the highest "target" block timestamp for progress display and
 * does not include `startBlock` timestamps.
 *
 * @throws Error if `chains` is empty.
 */
export function getHighestKnownBlockTimestamp(
  chains: ChainIndexingStatusSnapshot[],
): UnixTimestamp {
  if (chains.length === 0) {
    throw new Error(
      "Invariant violation: at least one chain is required to determine the highest known block timestamp",
    );
  }

  const startBlockTimestamps = chains.map((chain) => chain.config.startBlock.timestamp);

  const endBlockTimestamps = chains
    .map((chain) => chain.config)
    .filter((chainConfig) => chainConfig.rangeType === RangeTypeIds.Bounded)
    .map((chainConfig) => chainConfig.endBlock.timestamp);

  const backfillEndBlockTimestamps = chains
    .filter((chain) => chain.chainStatus === ChainIndexingStatusIds.Backfill)
    .map((chain) => chain.backfillEndBlock.timestamp);

  const latestKnownBlockTimestamps = chains
    .filter((chain) => chain.chainStatus === ChainIndexingStatusIds.Following)
    .map((chain) => chain.latestKnownBlock.timestamp);

  return Math.max(
    ...startBlockTimestamps,
    ...endBlockTimestamps,
    ...backfillEndBlockTimestamps,
    ...latestKnownBlockTimestamps,
  );
}

/**
 * Build a Cross-Chain Indexing Status Snapshot based on the omnichain indexing status snapshot.
 *
 * @param omnichainSnapshot - The omnichain indexing status snapshot.
 * @param snapshotTime - The timestamp when the cross-chain indexing status snapshot was generated.
 *        Will be adjusted upward if necessary to satisfy the invariant that snapshotTime must
 *        be >= the highest known block timestamp (handles clock skew and future block timestamps).
 * @returns The cross-chain indexing status snapshot.
 * @throws if the generated snapshot does not satisfy the invariants defined
 *         in {@link CrossChainIndexingStatusSnapshotOmnichain}
 */
export function buildCrossChainIndexingStatusSnapshotOmnichain(
  omnichainSnapshot: OmnichainIndexingStatusSnapshot,
  snapshotTime: UnixTimestamp,
): CrossChainIndexingStatusSnapshotOmnichain {
  const chains = Array.from(omnichainSnapshot.chains.values());
  const adjustedSnapshotTime = Math.max(snapshotTime, getHighestKnownBlockTimestamp(chains));

  return validateCrossChainIndexingStatusSnapshot({
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: omnichainSnapshot.omnichainIndexingCursor,
    omnichainSnapshot,
    snapshotTime: adjustedSnapshotTime,
  });
}
