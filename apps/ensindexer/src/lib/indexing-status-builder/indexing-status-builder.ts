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

interface ChainIndexingBlockRefs {
  startBlock: BlockRef;
  endBlock: BlockRef | null;
  backfillEndBlock: BlockRef;
}

export class IndexingStatusBuilder {
  private _chainsIndexingBlockRefs: Map<ChainId, ChainIndexingBlockRefs> | undefined;

  constructor(private localPonderClient: LocalPonderClient) {}

  /**
   * Get Omnichain Indexing Status Snapshot
   *
   * @returns Omnichain indexing status snapshot representing
   *          the current indexing status of all indexed chains.
   */
  async getOmnichainIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
    const [localPonderIndexingMetrics, localPonderStatus] = await Promise.all([
      this.localPonderClient.metrics(),
      this.localPonderClient.status(),
    ]);

    // Fetch the chains indexing block refs if not already cached.
    if (!this._chainsIndexingBlockRefs) {
      this._chainsIndexingBlockRefs = await this.fetchChainsIndexingBlockRefs(
        localPonderIndexingMetrics.chains,
      );
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
   * @returns A map of chain IDs to their corresponding indexing status snapshots.
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
    const { startBlock, endBlock, backfillEndBlock } = chainIndexingBlockRefs;
    const indexingConfig = createIndexingConfig(startBlock, endBlock);

    // In omnichain ordering, if the startBlock is the same as the
    // status block, the chain has not started yet.
    if (isBlockRefEqualTo(startBlock, checkpointBlock)) {
      return validateChainIndexingStatusSnapshot({
        chainStatus: ChainIndexingStatusIds.Queued,
        config: indexingConfig,
      } satisfies Unvalidated<ChainIndexingStatusSnapshotQueued>);
    }

    if (chainIndexingMetrics.state === ChainIndexingStates.Completed) {
      return validateChainIndexingStatusSnapshot({
        chainStatus: ChainIndexingStatusIds.Completed,
        latestIndexedBlock: checkpointBlock,
        config: indexingConfig as Unvalidated<ChainIndexingConfigDefinite>,
      } satisfies Unvalidated<ChainIndexingStatusSnapshotCompleted>);
    }

    if (chainIndexingMetrics.state === ChainIndexingStates.Realtime) {
      return validateChainIndexingStatusSnapshot({
        chainStatus: ChainIndexingStatusIds.Following,
        latestIndexedBlock: checkpointBlock,
        latestKnownBlock: chainIndexingMetrics.latestSyncedBlock,
        config: indexingConfig as Unvalidated<ChainIndexingConfigIndefinite>,
      } satisfies Unvalidated<ChainIndexingStatusSnapshotFollowing>);
    }

    return validateChainIndexingStatusSnapshot({
      chainStatus: ChainIndexingStatusIds.Backfill,
      latestIndexedBlock: checkpointBlock,
      backfillEndBlock,
      config: indexingConfig,
    } satisfies Unvalidated<ChainIndexingStatusSnapshotBackfill>);
  }

  /**
   * Fetch Chains Indexing Block Refs
   *
   * This method fetches the block refs for all indexed chains based on
   * the provided Local Ponder Indexing Metrics. It fetches the necessary block
   * refs for each chain in parallel and stores them in a map for later use
   * in building the Omnichain Indexing Status Snapshot.
   *
   * @param localChainsIndexingMetrics The Local Ponder Indexing Metrics for all indexed chains.
   * @returns A map of chain IDs to their corresponding block refs.
   * @throws Error if any of the invariants are violated during the fetching of block refs.
   */
  private async fetchChainsIndexingBlockRefs(
    localChainsIndexingMetrics: Map<ChainId, LocalChainIndexingMetrics>,
  ): Promise<Map<ChainId, ChainIndexingBlockRefs>> {
    const chainsIndexingBlockRefs = new Map<ChainId, ChainIndexingBlockRefs>();

    for (const [chainId, chainIndexingMetric] of localChainsIndexingMetrics.entries()) {
      if (chainIndexingMetric.state !== ChainIndexingStates.Historical) {
        throw new Error(
          `Expected historical indexing metrics for chain ID ${chainId}, but got state ${chainIndexingMetric.state}`,
        );
      }
      const { backfillEndBlock } = chainIndexingMetric;
      const { startBlock, endBlock } = this.localPonderClient.getChainBlockrange(chainId);

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
      chainIndexingBlocks.endBlock
        ? this.fetchBlockRef(chainId, chainIndexingBlocks.endBlock)
        : null,
      this.fetchBlockRef(chainId, chainIndexingBlocks.backfillEndBlock),
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
