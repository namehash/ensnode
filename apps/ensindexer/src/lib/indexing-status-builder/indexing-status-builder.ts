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
  type BlockNumberRange,
  buildBlockRefRange,
  type ChainId,
  type ChainIndexingConfig,
  type ChainIndexingMetrics,
  ChainIndexingStates,
  type ChainIndexingStatus,
  isBlockRefEqualTo,
  type LocalChainIndexingMetrics,
  type LocalPonderClient,
  RangeTypes,
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
    const [localPonderIndexingMetrics, ponderStatus] = await Promise.all([
      this.localPonderClient.metrics(),
      this.localPonderClient.status(),
    ]);

    // Fetch indexing config for indexed chains if not already cached.
    if (!this._immutableIndexingConfig) {
      this._immutableIndexingConfig = await this.fetchChainsIndexingConfig(
        localPonderIndexingMetrics.chains,
      );
    }

    const chainStatusSnapshots = this.buildChainIndexingStatusSnapshots(
      localPonderIndexingMetrics.chains,
      ponderStatus.chains,
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
    chainIndexingMetrics: Map<ChainId, ChainIndexingMetrics>,
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
   * @param chainIndexingMetrics - The Ponder indexing metrics for the chain.
   * @param chainIndexingStatus - The Ponder indexing status for the chain.
   * @param chainIndexingConfig - The indexing config for the chain.
   *
   * @returns The indexing status snapshot for the chain.
   * @throws Error if validation of the built snapshot fails.
   */

  private buildChainIndexingStatusSnapshot(
    chainIndexingMetrics: ChainIndexingMetrics,
    chainIndexingStatus: ChainIndexingStatus,
    chainIndexingConfig: ChainIndexingConfig,
  ): ChainIndexingStatusSnapshot {
    const { checkpointBlock } = chainIndexingStatus;
    const { indexedRange } = chainIndexingConfig;

    // In omnichain ordering, if the startBlock is the same as the
    // status block, the chain has not started yet.
    if (isBlockRefEqualTo(indexedRange.startBlock, checkpointBlock)) {
      return validateChainIndexingStatusSnapshot({
        chainStatus: ChainIndexingStatusIds.Queued,
        config: indexedRange,
      } satisfies Unvalidated<ChainIndexingStatusSnapshotQueued>);
    }

    switch (chainIndexingMetrics.state) {
      case ChainIndexingStates.Completed: {
        // Invariant: For a chain that has completed indexing, the indexed range must be definite,
        // as historical indexing had to have start and end blocks
        if (indexedRange.rangeType !== RangeTypes.Definite) {
          throw new Error(
            `The indexed range must be definite for a chain that has completed indexing.`,
          );
        }

        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Completed,
          latestIndexedBlock: checkpointBlock,
          config: indexedRange,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotCompleted>);
      }

      case ChainIndexingStates.Realtime: {
        // Invariant: For a chain that is in realtime indexing, the indexed range must be indefinite,
        // as realtime indexing is expected to be ongoing with no defined end block.
        if (indexedRange.rangeType !== RangeTypes.Indefinite) {
          throw new Error(
            `The indexed range must be indefinite for a chain that is in realtime indexing.`,
          );
        }

        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Following,
          latestIndexedBlock: checkpointBlock,
          latestKnownBlock: chainIndexingMetrics.latestSyncedBlock,
          config: indexedRange,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotFollowing>);
      }

      case ChainIndexingStates.Historical: {
        // Invariant: For a chain that is currently in historical indexing state,
        // the backfill end block must be defined.
        if (chainIndexingConfig.backfillEndBlock === null) {
          throw new Error(
            `Backfill end block must be defined for a chain that is in historical indexing state.`,
          );
        }

        const { backfillEndBlock } = chainIndexingConfig;

        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Backfill,
          latestIndexedBlock: checkpointBlock,
          backfillEndBlock,
          config: indexedRange,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotBackfill>);
      }
    }
  }

  /**
   * Fetch Chains Indexing Config
   *
   * This method fetches the indexing config for all indexed chains based on
   * the provided Local Ponder Indexing Metrics. It fetches the necessary config
   * for each chain and stores them in a map for later use while building
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
   * @param chainIndexingBlocks - The blocks relevant for indexing of the chain.
   * @param backfillEndBlockNumber - The block number at which the backfill will end, if applicable.
   * @returns The indexing config for the specified chain.
   * @throws Error if fetching any of the indexing config fails.
   */
  private async fetchChainIndexingConfig(
    chainId: ChainId,
    chainIndexingBlockrange: BlockNumberRange,
    backfillEndBlockNumber: BlockNumber | null,
  ): Promise<ChainIndexingConfig> {
    const [startBlockRef, endBlockRef, backfillEndBlockRef] = await Promise.all([
      this.fetchBlockRef(chainId, chainIndexingBlockrange.startBlock),

      chainIndexingBlockrange.rangeType === RangeTypes.Definite
        ? this.fetchBlockRef(chainId, chainIndexingBlockrange.endBlock)
        : null,

      backfillEndBlockNumber !== null ? this.fetchBlockRef(chainId, backfillEndBlockNumber) : null,
    ]);

    return {
      indexedRange: buildBlockRefRange(startBlockRef, endBlockRef),
      backfillEndBlock: backfillEndBlockRef,
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
