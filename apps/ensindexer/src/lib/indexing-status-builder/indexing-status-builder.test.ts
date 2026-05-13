import { afterEach, describe, expect, it, vi } from "vitest";

import "@/lib/__test__/mockLogger";

import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  buildBlockNumberRange,
  type ChainIndexingMetricsCompleted,
  type ChainIndexingMetricsRealtime,
  ChainIndexingStates,
  type LocalChainIndexingMetricsHistorical,
  type LocalPonderClient,
  type PonderIndexingStatus,
  RangeTypeIds,
} from "@ensnode/ponder-sdk";

import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import { IndexingStatusBuilder } from "./indexing-status-builder";
import {
  buildLocalChainsIndexingMetrics,
  buildLocalPonderClientMock,
  buildPublicClientMock,
  chainId,
} from "./indexing-status-builder.mock";

describe("IndexingStatusBuilder", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Building omnichain indexing status snapshot", () => {
    it("builds 'unstarted' omnichain snapshot", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: latestBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: earliestBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, latestBlockRef.number)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(3);
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                rangeType: RangeTypeIds.Bounded,
                startBlock: earliestBlockRef,
                endBlock: latestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
        ]),
        omnichainIndexingCursor: earliestBlockRef.timestamp - 1,
      } satisfies OmnichainIndexingStatusSnapshot);
    });

    it("builds 'backfill' omnichain snapshot", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: earlierBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, undefined)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(2);
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              latestIndexedBlock: earlierBlockRef,
              backfillEndBlock: latestBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
        ]),
        omnichainIndexingCursor: earlierBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });

    it("builds 'completed' omnichain snapshot", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localMetricsHistorical = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: latestBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localMetricsCompleted = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Completed,
              finalIndexedBlock: latestBlockRef,
            } satisfies ChainIndexingMetricsCompleted,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: latestBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi
          .fn()
          .mockResolvedValueOnce(localMetricsHistorical)
          .mockResolvedValueOnce(localMetricsCompleted),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, latestBlockRef.number)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      await builder.getOmnichainIndexingStatusSnapshot();
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(3);
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Completed,
              latestIndexedBlock: latestBlockRef,
              config: {
                rangeType: RangeTypeIds.Bounded,
                startBlock: earliestBlockRef,
                endBlock: latestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotCompleted,
          ],
        ]),
        omnichainIndexingCursor: latestBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });

    it("builds 'following' omnichain snapshot", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localMetricsHistorical = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: laterBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localMetricsRealtime = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Realtime,
              latestSyncedBlock: laterBlockRef,
            } satisfies ChainIndexingMetricsRealtime,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: laterBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi
          .fn()
          .mockResolvedValueOnce(localMetricsHistorical)
          .mockResolvedValueOnce(localMetricsRealtime),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, undefined)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      await builder.getOmnichainIndexingStatusSnapshot();
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(2);
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Following,
              latestIndexedBlock: laterBlockRef,
              latestKnownBlock: laterBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      });
    });
  });

  describe("Caching behavior", () => {
    it("reuses cached block refs across calls", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localIndexingMetrics1 = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const indexingStatus1: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: laterBlockRef }]]),
      };

      const localIndexingMetrics2 = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: laterBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const indexingStatus2: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: latestBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi
          .fn()
          .mockResolvedValueOnce(localIndexingMetrics1)
          .mockResolvedValueOnce(localIndexingMetrics2),
        status: vi
          .fn()
          .mockResolvedValueOnce(indexingStatus1)
          .mockResolvedValueOnce(indexingStatus2),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, undefined)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      await builder.getOmnichainIndexingStatusSnapshot();
      await builder.getOmnichainIndexingStatusSnapshot();

      // Assert
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(2); // RPC calls for startBlock, and backfillEndBlock
    });

    it("retries fetching block refs when RPC call fails", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();
      const getBlockMock = vi.spyOn(publicClientMock, "getBlock") as unknown as ReturnType<
        typeof vi.fn
      >;
      getBlockMock.mockRejectedValueOnce(new Error("RPC down"));

      const localIndexingMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const indexingStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: earlierBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localIndexingMetrics),
        status: vi.fn().mockResolvedValue(indexingStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, latestBlockRef.number)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act & Assert
      await expect(builder.getOmnichainIndexingStatusSnapshot()).rejects.toThrowError(
        /Error fetching block for chain ID 1 at block number 999: RPC down/,
      );

      await expect(builder.getOmnichainIndexingStatusSnapshot()).resolves.toBeDefined();
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(6);
    });

    it("allows non-historical indexing metrics on first call", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Realtime,
              latestSyncedBlock: latestBlockRef,
            } satisfies ChainIndexingMetricsRealtime,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: laterBlockRef }]]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, undefined)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert
      expect(publicClientMock.getBlock).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Following,
              latestIndexedBlock: laterBlockRef,
              latestKnownBlock: latestBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });
  });

  describe("Race condition handling", () => {
    it("clamps latestIndexedBlock to backfillEndBlock when checkpointBlock advances past it in historical", async () => {
      // Arrange — simulate a race where the checkpoint block has advanced
      // past the backfill end block between concurrent fetches.
      const publicClientMock = buildPublicClientMock();

      // checkpointBlock (laterBlockRef/1025) is ahead of backfillEndBlock (earlierBlockRef/1024)
      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: latestBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: earlierBlockRef.number, // 1024
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: laterBlockRef }]]), // 1025, ahead of backfillEndBlock
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, undefined)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert — latestIndexedBlock should be clamped to backfillEndBlock (earlierBlockRef)
      // instead of the checkpointBlock (laterBlockRef)
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              latestIndexedBlock: earlierBlockRef, // clamped to backfillEndBlock
              backfillEndBlock: earlierBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
        ]),
        omnichainIndexingCursor: earlierBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });

    it("clamps latestKnownBlock when checkpointBlock is ahead of latestSyncedBlock in realtime", async () => {
      // Arrange — simulate a race where the checkpoint block has advanced
      // past the synced block metric between concurrent fetches.
      const publicClientMock = buildPublicClientMock();

      const localMetricsHistorical = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: laterBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      // In realtime, latestSyncedBlock is behind the checkpoint
      const localMetricsRealtime = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Realtime,
              latestSyncedBlock: earlierBlockRef, // behind checkpointBlock
            } satisfies ChainIndexingMetricsRealtime,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([[chainId, { checkpointBlock: laterBlockRef }]]), // ahead of latestSyncedBlock
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi
          .fn()
          .mockResolvedValueOnce(localMetricsHistorical)
          .mockResolvedValueOnce(localMetricsRealtime),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, undefined)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      await builder.getOmnichainIndexingStatusSnapshot();
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert — latestKnownBlock should be clamped to checkpointBlock (laterBlockRef)
      // instead of the stale latestSyncedBlock (earlierBlockRef)
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            chainId,
            {
              chainStatus: ChainIndexingStatusIds.Following,
              latestIndexedBlock: laterBlockRef,
              latestKnownBlock: laterBlockRef, // clamped: same as latestIndexedBlock
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });
  });

  describe("Crash recovery handling", () => {
    it("promotes a Queued chain to Backfill when other chains' progress has advanced past its startBlock", async () => {
      // Arrange — simulate post-crash-recovery snapshot:
      // - Chain A: was actively backfilling pre-crash; checkpoint is ahead of startBlock.
      // - Chain B: was Queued pre-crash (cursor hadn't reached its startBlock yet),
      //   so its checkpoint == startBlock. But Chain A's checkpoint timestamp now
      //   exceeds Chain B's startBlock timestamp, so Chain B is no longer Queued —
      //   Ponder just hasn't bumped its per-chain checkpoint because no events on
      //   Chain B have been processed yet.
      const chainA = 1;
      const chainB = 10;

      const publicClientMock = buildPublicClientMock();

      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainA,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: laterBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
          [
            chainB,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([
          [chainA, { checkpointBlock: laterBlockRef }],
          [chainB, { checkpointBlock: earlierBlockRef }], // == Chain B's startBlock
        ]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi.fn((id: number) => {
          if (id === chainA) return buildBlockNumberRange(earliestBlockRef.number, undefined);
          if (id === chainB) return buildBlockNumberRange(earlierBlockRef.number, undefined);
          throw new Error(`Unexpected chain ID ${id}`);
        }),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert — Chain B is promoted from Queued to Backfill with a degenerate
      // `latestIndexedBlock = startBlock`, and the snapshot validates as Backfill.
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: new Map([
          [
            chainA,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              latestIndexedBlock: laterBlockRef,
              backfillEndBlock: latestBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
          [
            chainB,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              latestIndexedBlock: earlierBlockRef, // == Chain B's startBlock
              backfillEndBlock: latestBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earlierBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });

    it("leaves a Queued chain alone when the omnichain cursor has not reached its startBlock", async () => {
      // Arrange — the inverse case: Chain B's startBlock is in the future
      // relative to Chain A's progress, so it is genuinely Queued.
      const chainA = 1;
      const chainB = 10;

      const publicClientMock = buildPublicClientMock();

      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainA,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
          [
            chainB,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: laterBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map([
          [chainA, { checkpointBlock: earlierBlockRef }],
          [chainB, { checkpointBlock: laterBlockRef }], // == Chain B's startBlock
        ]),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi.fn((id: number) => {
          if (id === chainA) return buildBlockNumberRange(earliestBlockRef.number, undefined);
          if (id === chainB) return buildBlockNumberRange(laterBlockRef.number, undefined);
          throw new Error(`Unexpected chain ID ${id}`);
        }),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act
      const result = await builder.getOmnichainIndexingStatusSnapshot();

      // Assert — Chain B stays Queued because Chain A's cursor is at earlierBlockRef.ts,
      // which is < Chain B's startBlock.ts (laterBlockRef.ts).
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: new Map([
          [
            chainA,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              latestIndexedBlock: earlierBlockRef,
              backfillEndBlock: latestBlockRef,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
          [
            chainB,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: laterBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
        ]),
        omnichainIndexingCursor: earlierBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot);
    });
  });

  describe("Error handling", () => {
    it("throws when indexing status is missing for a chain", async () => {
      // Arrange
      const publicClientMock = buildPublicClientMock();

      const localMetrics = buildLocalChainsIndexingMetrics(
        new Map([
          [
            chainId,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: latestBlockRef,
              historicalTotalBlocks: 100,
              backfillEndBlock: latestBlockRef.number,
            } satisfies LocalChainIndexingMetricsHistorical,
          ],
        ]),
      );

      const localStatus: PonderIndexingStatus = {
        chains: new Map(),
      };

      const localPonderClientMock = buildLocalPonderClientMock({
        metrics: vi.fn().mockResolvedValue(localMetrics),
        status: vi.fn().mockResolvedValue(localStatus),
        getIndexedBlockrange: vi
          .fn()
          .mockReturnValue(buildBlockNumberRange(earliestBlockRef.number, latestBlockRef.number)),
        getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
      });

      const builder = new IndexingStatusBuilder(localPonderClientMock as LocalPonderClient);

      // Act & Assert
      await expect(builder.getOmnichainIndexingStatusSnapshot()).rejects.toThrowError(
        /Indexing status not found for chain ID 1/,
      );
    });
  });
});
