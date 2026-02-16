import type { BlockRef, ChainId, UnixTimestamp } from "../../shared/types";
import { ChainIndexingStatusIds } from "./chain-indexing-status-snapshot";
import type { OmnichainIndexingStatusSnapshot } from "./omnichain-indexing-status-snapshot";

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
