import {
  type BlockRef,
  bigIntToNumber,
  buildOmnichainIndexingStatusSnapshot,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  deserializeBlockRef,
  type OmnichainIndexingStatusSnapshot,
  type Unvalidated,
  validateChainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  type BlockNumber,
  type BlockNumberRangeWithStartBlock,
  type BlockRefRangeBounded,
  type BlockRefRangeLeftBounded,
  type BlockRefRangeWithStartBlock,
  buildBlockRefRange,
  type ChainId,
  type ChainIndexingConfig,
  ChainIndexingStates,
  type ChainIndexingStatus,
  isBlockRefEqualTo,
  type LocalChainIndexingMetrics,
  type LocalPonderClient,
  RangeTypeIds,
} from "@ensnode/ponder-sdk";

export class IndexingStatusBuilder {
  /**
   * Immutable Indexing Config
   *
   * This property is used to cache the indexing config for indexed chains
   * after the config is fetched for the first time. This is done to avoid
   * redundant RPC calls to fetch block references.
   */
  private _immutableIndexingConfig: Map<ChainId, ChainIndexingConfig> | undefined;

  constructor(private localPonderClient: LocalPonderClient) {}

  /**
   * Get Omnichain Indexing Status Snapshot
   */
  async getOmnichainIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
    const [localPonderIndexingMetrics, localPonderStatus] = await Promise.all([
      this.localPonderClient.metrics(),
      this.localPonderClient.status(),
    ]);

    // Fetch and cache the immutable indexing config for indexed chains if not already cached.
    if (!this._immutableIndexingConfig) {
      const chainsIndexingMetrics = localPonderIndexingMetrics.chains;

      this._immutableIndexingConfig = await this.fetchChainsIndexingConfig(chainsIndexingMetrics);
    }

    const chainStatusSnapshots = this.buildChainIndexingStatusSnapshots(
      localPonderIndexingMetrics.chains,
      localPonderStatus.chains,
      this._immutableIndexingConfig,
    );

    return buildOmnichainIndexingStatusSnapshot(chainStatusSnapshots);
  }

  /**
   * Build Chain Indexing Status Snapshots for all indexed chains.
   *
   * @param chainIndexingMetrics - Indexing metrics for all indexed chains.
   * @param chainIndexingStatuses - Indexing statuses for all indexed chains.
   * @param chainsIndexingConfig - Indexing config for all indexed chains.
   *
   * @returns A map of chain IDs to their corresponding indexing status snapshots.
   *
   * @throws Error if required data for any chain is missing or if any of the invariants are violated.
   */
  private buildChainIndexingStatusSnapshots(
    chainIndexingMetrics: Map<ChainId, LocalChainIndexingMetrics>,
    chainIndexingStatuses: Map<ChainId, ChainIndexingStatus>,
    chainsIndexingConfig: Map<ChainId, ChainIndexingConfig>,
  ): Map<ChainId, ChainIndexingStatusSnapshot> {
    const chainStatusSnapshots = new Map<ChainId, ChainIndexingStatusSnapshot>();

    for (const [chainId, chainIndexingMetric] of chainIndexingMetrics.entries()) {
      const chainIndexingStatus = chainIndexingStatuses.get(chainId);
      const chainIndexingConfig = chainsIndexingConfig.get(chainId);

      // Invariants ensuring required data is available.
      if (!chainIndexingStatus) {
        throw new Error(`Indexing status not found for chain ID ${chainId}`);
      }

      if (!chainIndexingConfig) {
        throw new Error(`Indexing config not found for chain ID ${chainId}`);
      }

      const chainStatusSnapshot = this.buildChainIndexingStatusSnapshot(
        chainIndexingMetric,
        chainIndexingStatus,
        chainIndexingConfig,
      );

      chainStatusSnapshots.set(chainId, chainStatusSnapshot);
    }

    return chainStatusSnapshots;
  }

  /**
   * Build Chain Indexing Status Snapshot for a single indexed chain.
   *
   * @param chainIndexingMetrics - The local Ponder indexing metrics for the chain.
   * @param chainIndexingStatus - The Ponder indexing status for the chain.
   * @param chainIndexingConfig - The indexing config for the chain.
   *
   * @returns The indexing status snapshot for the chain.
   * @throws Error if validation of the built snapshot fails.
   */

  private buildChainIndexingStatusSnapshot(
    chainIndexingMetrics: LocalChainIndexingMetrics,
    chainIndexingStatus: ChainIndexingStatus,
    chainIndexingConfig: ChainIndexingConfig,
  ): ChainIndexingStatusSnapshot {
    const { checkpointBlock } = chainIndexingStatus;
    const { indexedBlockrange } = chainIndexingConfig;

    // In omnichain ordering, if the startBlock is the same as the
    // status block, the chain has not started yet.
    if (isBlockRefEqualTo(indexedBlockrange.startBlock, checkpointBlock)) {
      return validateChainIndexingStatusSnapshot({
        chainStatus: ChainIndexingStatusIds.Queued,
        config: indexedBlockrange as Unvalidated<BlockRefRangeWithStartBlock>,
      } satisfies Unvalidated<ChainIndexingStatusSnapshotQueued>);
    }

    switch (chainIndexingMetrics.state) {
      case ChainIndexingStates.Completed:
        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Completed,
          latestIndexedBlock: checkpointBlock,
          config: indexedBlockrange as Unvalidated<BlockRefRangeBounded>,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotCompleted>);

      case ChainIndexingStates.Realtime:
        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Following,
          latestIndexedBlock: checkpointBlock,
          latestKnownBlock: chainIndexingMetrics.latestSyncedBlock,
          config: indexedBlockrange as Unvalidated<BlockRefRangeLeftBounded>,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotFollowing>);

      case ChainIndexingStates.Historical: {
        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Backfill,
          latestIndexedBlock: checkpointBlock,
          backfillEndBlock: chainIndexingConfig.backfillEndBlock as Unvalidated<BlockRef>,
          config: indexedBlockrange as Unvalidated<BlockRefRangeWithStartBlock>,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotBackfill>);
      }
    }
  }

  /**
   * Fetch Chains Indexing Config
   *
   * This method fetches the indexing config for all indexed chains based on
   * the provided Local Ponder Indexing Metrics. It fetches the necessary block
   * refs for each chain and stores them in a map for later use while building
   * the Omnichain Indexing Status Snapshot.
   *
   * @param localChainsIndexingMetrics The Local Ponder Indexing Metrics for all indexed chains.
   * @returns A map of chain IDs to their corresponding indexing config.
   * @throws Error if fetching any of the indexing config fails.
   */
  private async fetchChainsIndexingConfig(
    localChainsIndexingMetrics: Map<ChainId, LocalChainIndexingMetrics>,
  ): Promise<Map<ChainId, ChainIndexingConfig>> {
    const chainsIndexingConfig = new Map<ChainId, ChainIndexingConfig>();

    for (const [chainId, chainIndexingMetric] of localChainsIndexingMetrics.entries()) {
      let backfillEndBlock: BlockNumber | null = null;

      if (chainIndexingMetric.state === ChainIndexingStates.Historical) {
        backfillEndBlock = chainIndexingMetric.backfillEndBlock;
      }

      const indexedBlockrange = this.localPonderClient.getIndexedBlockrange(chainId);
      const chainIndexingConfig = await this.fetchChainIndexingConfig(
        chainId,
        indexedBlockrange,
        backfillEndBlock,
      );

      chainsIndexingConfig.set(chainId, chainIndexingConfig);
    }

    return chainsIndexingConfig;
  }

  /**
   * Fetch Chain Indexing Config
   *
   * This method fetches the indexing config for a specific chain.
   * It fetches the necessary config in parallel and returns
   * them as a single object.
   *
   * @param chainId - The ID of the chain for which to fetch indexing config.
   * @param chainIndexingBlockrange - The block range (with start block) relevant for indexing of the chain.
   * @param backfillEndBlockNumber - The block number at which the backfill will end, if applicable.
   * @returns The indexing config for the specified chain.
   * @throws Error if fetching any of the indexing config fails.
   */
  private async fetchChainIndexingConfig(
    chainId: ChainId,
    chainIndexingBlockrange: BlockNumberRangeWithStartBlock,
    backfillEndBlockNumber: BlockNumber | null,
  ): Promise<ChainIndexingConfig> {
    const [startBlockRef, endBlockRef, backfillEndBlockRef] = await Promise.all([
      this.fetchBlockRef(chainId, chainIndexingBlockrange.startBlock),

      chainIndexingBlockrange.rangeType === RangeTypeIds.Bounded
        ? this.fetchBlockRef(chainId, chainIndexingBlockrange.endBlock)
        : null,

      backfillEndBlockNumber !== null ? this.fetchBlockRef(chainId, backfillEndBlockNumber) : null,
    ]);

    const indexedBlockrange = endBlockRef
      ? buildBlockRefRange(startBlockRef, endBlockRef)
      : buildBlockRefRange(startBlockRef, undefined);

    return {
      backfillEndBlock: backfillEndBlockRef,
      indexedBlockrange,
    };
  }

  /**
   * Fetch Block Reference
   *
   * Fetches the block reference for a specific block number on a given chain.
   * @param chainId - The ID of the chain for which to fetch the block reference.
   * @param blockNumber - The block number for which to fetch the reference.
   * @returns The block reference for the specified block number on the given chain.
   * @throws Error if fetching the block reference fails.
   */
  private async fetchBlockRef(chainId: ChainId, blockNumber: BlockNumber): Promise<BlockRef> {
    try {
      const publicClient = this.localPonderClient.getCachedPublicClient(chainId);
      const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });

      return deserializeBlockRef({
        timestamp: bigIntToNumber(block.timestamp),
        number: bigIntToNumber(block.number),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      throw new Error(
        `Error fetching block for chain ID ${chainId} at block number ${blockNumber}: ${errorMessage}`,
      );
    }
  }
}
