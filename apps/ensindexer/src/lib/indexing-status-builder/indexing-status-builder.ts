import {
  type BlockRef,
  bigIntToNumber,
  buildOmnichainIndexingStatusSnapshot,
  type ChainIndexingConfigDefinite,
  type ChainIndexingConfigIndefinite,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  createIndexingConfig,
  deserializeBlockRef,
  type OmnichainIndexingStatusSnapshot,
  type Unvalidated,
  validateChainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  type BlockNumber,
  type ChainId,
  type ChainIndexingBlocks,
  ChainIndexingStates,
  type ChainIndexingStatus,
  isBlockRefEqualTo,
  type LocalChainIndexingMetrics,
  type LocalPonderClient,
} from "@ensnode/ponder-sdk";

/**
 * Block refs for an indexed chain.
 *
 * Useful for building the Chain Indexing Status Snapshot for the chain.
 */
interface ChainIndexingBlockRefs {
  startBlock: BlockRef;
  endBlock: BlockRef | null;
  backfillEndBlock: BlockRef | null;
}

export class IndexingStatusBuilder {
  private _chainsIndexingBlockRefs: Map<ChainId, ChainIndexingBlockRefs> | undefined;

  constructor(private localPonderClient: LocalPonderClient) {}

  /**
   * Get Omnichain Indexing Status Snapshot
   */
  async getOmnichainIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
    const [localPonderIndexingMetrics, localPonderStatus] = await Promise.all([
      this.localPonderClient.metrics(),
      this.localPonderClient.status(),
    ]);

    // Fetch the chains indexing block refs if not already cached.
    if (!this._chainsIndexingBlockRefs) {
      const chainsIndexingMetrics = localPonderIndexingMetrics.chains;

      this._chainsIndexingBlockRefs =
        await this.fetchChainsIndexingBlockRefs(chainsIndexingMetrics);
    }

    const chainStatusSnapshots = this.buildChainIndexingStatusSnapshots(
      localPonderIndexingMetrics.chains,
      localPonderStatus.chains,
      this._chainsIndexingBlockRefs,
    );

    return buildOmnichainIndexingStatusSnapshot(chainStatusSnapshots);
  }

  /**
   * Build Chain Indexing Status Snapshots for all indexed chains.
   *
   * @param chainIndexingMetrics - Indexing metrics for all indexed chains.
   * @param chainIndexingStatuses - Indexing statuses for all indexed chains.
   * @param chainsIndexingBlockRefs - Block references for all indexed chains.
   *
   * @returns A map of chain IDs to their corresponding indexing status snapshots.
   *
   * @throws Error if required data for any chain is missing or if any of the invariants are violated.
   */
  private buildChainIndexingStatusSnapshots(
    chainIndexingMetrics: Map<ChainId, LocalChainIndexingMetrics>,
    chainIndexingStatuses: Map<ChainId, ChainIndexingStatus>,
    chainsIndexingBlockRefs: Map<ChainId, ChainIndexingBlockRefs>,
  ): Map<ChainId, ChainIndexingStatusSnapshot> {
    const chainStatusSnapshots = new Map<ChainId, ChainIndexingStatusSnapshot>();

    for (const [chainId, chainIndexingMetric] of chainIndexingMetrics.entries()) {
      const chainIndexingStatus = chainIndexingStatuses.get(chainId);
      const chainIndexingBlockRefs = chainsIndexingBlockRefs.get(chainId);

      // Invariants ensuring required data is available.
      if (!chainIndexingStatus) {
        throw new Error(`Indexing status not found for chain ID ${chainId}`);
      }

      if (!chainIndexingBlockRefs) {
        throw new Error(`Indexing block refs not found for chain ID ${chainId}`);
      }

      const chainStatusSnapshot = this.buildChainIndexingStatusSnapshot(
        chainIndexingMetric,
        chainIndexingStatus,
        chainIndexingBlockRefs,
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
   * @param chainIndexingBlockRefs - The block references for the chain.
   *
   * @returns The indexing status snapshot for the chain.
   * @throws Error if validation of the built snapshot fails.
   */

  private buildChainIndexingStatusSnapshot(
    chainIndexingMetrics: LocalChainIndexingMetrics,
    chainIndexingStatus: ChainIndexingStatus,
    chainIndexingBlockRefs: ChainIndexingBlockRefs,
  ): ChainIndexingStatusSnapshot {
    const { checkpointBlock } = chainIndexingStatus;
    const { startBlock, endBlock } = chainIndexingBlockRefs;
    const indexingConfig = createIndexingConfig(startBlock, endBlock);

    // In omnichain ordering, if the startBlock is the same as the
    // status block, the chain has not started yet.
    if (isBlockRefEqualTo(startBlock, checkpointBlock)) {
      return validateChainIndexingStatusSnapshot({
        chainStatus: ChainIndexingStatusIds.Queued,
        config: indexingConfig,
      } satisfies Unvalidated<ChainIndexingStatusSnapshotQueued>);
    }

    switch (chainIndexingMetrics.state) {
      case ChainIndexingStates.Completed:
        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Completed,
          latestIndexedBlock: checkpointBlock,
          config: indexingConfig as Unvalidated<ChainIndexingConfigDefinite>,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotCompleted>);

      case ChainIndexingStates.Realtime:
        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Following,
          latestIndexedBlock: checkpointBlock,
          latestKnownBlock: chainIndexingMetrics.latestSyncedBlock,
          config: indexingConfig as Unvalidated<ChainIndexingConfigIndefinite>,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotFollowing>);

      case ChainIndexingStates.Historical: {
        if (!chainIndexingBlockRefs.backfillEndBlock) {
          throw new Error(
            "Chain Indexing Block Refs must include a backfill end block to build a backfill indexing status snapshot",
          );
        }

        return validateChainIndexingStatusSnapshot({
          chainStatus: ChainIndexingStatusIds.Backfill,
          latestIndexedBlock: checkpointBlock,
          backfillEndBlock: chainIndexingBlockRefs.backfillEndBlock ?? null,
          config: indexingConfig,
        } satisfies Unvalidated<ChainIndexingStatusSnapshotBackfill>);
      }
    }
  }

  /**
   * Fetch Chains Indexing Block Refs
   *
   * This method fetches the block refs for all indexed chains based on
   * the provided Local Ponder Indexing Metrics. It fetches the necessary block
   * refs for each chain and stores them in a map for later use while building
   * the Omnichain Indexing Status Snapshot.
   *
   * @param localChainsIndexingMetrics The Local Ponder Indexing Metrics for all indexed chains.
   * @returns A map of chain IDs to their corresponding block refs.
   * @throws Error if fetching any of the block refs fails.
   */
  private async fetchChainsIndexingBlockRefs(
    localChainsIndexingMetrics: Map<ChainId, LocalChainIndexingMetrics>,
  ): Promise<Map<ChainId, ChainIndexingBlockRefs>> {
    const chainsIndexingBlockRefs = new Map<ChainId, ChainIndexingBlockRefs>();

    for (const [chainId, chainIndexingMetric] of localChainsIndexingMetrics.entries()) {
      let backfillEndBlock: BlockNumber | null = null;

      if (chainIndexingMetric.state === ChainIndexingStates.Historical) {
        backfillEndBlock = chainIndexingMetric.backfillEndBlock;
      }

      const indexedBlockrange = this.localPonderClient.getIndexedBlockrange(chainId);

      if (!indexedBlockrange) {
        throw new Error(`Indexed blockrange not found for chain ID ${chainId}`);
      }

      const { startBlock, endBlock = null } = indexedBlockrange;

      const chainIndexingBlockRefs = await this.fetchChainIndexingBlockRefs(chainId, {
        startBlock,
        endBlock,
        backfillEndBlock,
      });

      chainsIndexingBlockRefs.set(chainId, chainIndexingBlockRefs);
    }

    return chainsIndexingBlockRefs;
  }

  /**
   * Fetch Chain Indexing Block Refs
   *
   * This method fetches the block references for a specific chain.
   * It fetches the necessary block refs in parallel and returns
   * them as a single object.
   *
   * @param chainId - The ID of the chain for which to fetch block refs.
   * @param chainIndexingBlocks - The blocks relevant for indexing of the chain.
   * @returns The block references for the specified chain.
   * @throws Error if fetching any of the block refs fails.
   */
  private async fetchChainIndexingBlockRefs(
    chainId: ChainId,
    chainIndexingBlocks: ChainIndexingBlocks,
  ): Promise<ChainIndexingBlockRefs> {
    const [startBlock, endBlock, backfillEndBlock] = await Promise.all([
      this.fetchBlockRef(chainId, chainIndexingBlocks.startBlock),

      typeof chainIndexingBlocks.endBlock === "number"
        ? this.fetchBlockRef(chainId, chainIndexingBlocks.endBlock)
        : null,

      typeof chainIndexingBlocks.backfillEndBlock === "number"
        ? this.fetchBlockRef(chainId, chainIndexingBlocks.backfillEndBlock)
        : null,
    ]);

    return { startBlock, endBlock, backfillEndBlock };
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
