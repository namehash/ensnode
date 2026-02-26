import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  type ChainIndexingMetricsCompleted,
  type ChainIndexingMetricsRealtime,
  ChainIndexingStates,
  type LocalChainIndexingMetricsHistorical,
  type LocalPonderClient,
  type PonderIndexingStatus,
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
        getIndexedBlockrange: vi.fn().mockReturnValue({
          startBlock: earliestBlockRef.number,
          endBlock: latestBlockRef.number,
        }),
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
                configType: ChainIndexingConfigTypeIds.Definite,
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
        getIndexedBlockrange: vi.fn().mockReturnValue({
          startBlock: earliestBlockRef.number,
          endBlock: undefined,
        }),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
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
        getIndexedBlockrange: vi.fn().mockReturnValue({
          startBlock: earliestBlockRef.number,
          endBlock: latestBlockRef.number,
        }),
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
                configType: ChainIndexingConfigTypeIds.Definite,
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
        getIndexedBlockrange: vi.fn().mockReturnValue({
          startBlock: earliestBlockRef.number,
          endBlock: undefined,
        }),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
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
          .mockReturnValue({ startBlock: earliestBlockRef.number, endBlock: undefined }),
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
        getIndexedBlockrange: vi.fn().mockReturnValue({
          startBlock: earliestBlockRef.number,
          endBlock: latestBlockRef.number,
        }),
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
          .mockReturnValue({ startBlock: earliestBlockRef.number, endBlock: undefined }),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earliestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
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
        getIndexedBlockrange: vi.fn().mockReturnValue({
          startBlock: earliestBlockRef.number,
          endBlock: latestBlockRef.number,
        }),
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
