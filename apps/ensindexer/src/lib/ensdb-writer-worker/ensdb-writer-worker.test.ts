import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildIndexingMetadataContextInitialized,
  type IndexingMetadataContextInitialized,
} from "@ensnode/ensnode-sdk";

import "@/lib/__test__/mockLogger";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";

import {
  createMockCrossChainSnapshot,
  createMockEnsDbWriter,
  createMockEnsDbWriterWorker,
  createMockIndexingMetadataContextInitialized,
  createMockIndexingMetadataContextUninitialized,
  createMockIndexingStatusBuilder,
  createMockOmnichainSnapshot,
} from "./ensdb-writer-worker.mock";

vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual = await vi.importActual("@ensnode/ensnode-sdk");

  return {
    ...actual,
    buildCrossChainIndexingStatusSnapshotOmnichain: vi.fn(),
    buildIndexingMetadataContextInitialized: vi.fn(),
  };
});

describe("EnsDbWriterWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("run() - worker initialization", () => {
    it("starts the interval for upserting indexing metadata context", async () => {
      // arrange
      const omnichainSnapshot = createMockOmnichainSnapshot();
      const crossChainSnapshot = createMockCrossChainSnapshot({ omnichainSnapshot });
      const indexingMetadataContext = createMockIndexingMetadataContextInitialized();

      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(crossChainSnapshot);
      vi.mocked(buildIndexingMetadataContextInitialized).mockReturnValue(
        indexingMetadataContext as IndexingMetadataContextInitialized,
      );

      const ensDbClient = createMockEnsDbWriter({
        getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContext),
      });
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingStatusBuilder: createMockIndexingStatusBuilder(omnichainSnapshot),
      });

      // act
      await worker.run();

      // advance time to trigger interval
      await vi.advanceTimersByTimeAsync(1000);

      // assert - snapshot should be upserted via upsertIndexingMetadataContext
      expect(ensDbClient.getIndexingMetadataContext).toHaveBeenCalled();
      expect(buildCrossChainIndexingStatusSnapshotOmnichain).toHaveBeenCalledWith(
        omnichainSnapshot,
        expect.any(Number),
      );
      expect(buildIndexingMetadataContextInitialized).toHaveBeenCalledWith(
        crossChainSnapshot,
        (indexingMetadataContext as IndexingMetadataContextInitialized).stackInfo,
      );
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledWith(
        indexingMetadataContext,
      );

      // cleanup
      worker.stop();
    });

    it("throws error when worker is already running", async () => {
      // arrange
      const worker = createMockEnsDbWriterWorker();

      // act - first run
      await worker.run();

      // assert - second run should throw
      await expect(worker.run()).rejects.toThrow("EnsDbWriterWorker is already running");

      // cleanup
      worker.stop();
    });
  });

  describe("stop() - worker termination", () => {
    it("stops the interval when stop() is called", async () => {
      // arrange
      const indexingMetadataContext = createMockIndexingMetadataContextInitialized();
      const upsertIndexingMetadataContext = vi.fn().mockResolvedValue(undefined);
      const ensDbClient = createMockEnsDbWriter({
        getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContext),
        upsertIndexingMetadataContext,
      });
      const worker = createMockEnsDbWriterWorker({ ensDbClient });

      // act
      await worker.run();
      await vi.advanceTimersByTimeAsync(1000);

      const callCountBeforeStop = upsertIndexingMetadataContext.mock.calls.length;

      worker.stop();

      // advance time after stop
      await vi.advanceTimersByTimeAsync(2000);

      // assert - no more calls after stop
      expect(upsertIndexingMetadataContext).toHaveBeenCalledTimes(callCountBeforeStop);
    });
  });

  describe("isRunning - worker state", () => {
    it("indicates isRunning status correctly", async () => {
      // arrange
      const worker = createMockEnsDbWriterWorker();

      // assert - not running initially
      expect(worker.isRunning).toBe(false);

      // act - start worker
      await worker.run();

      // assert - running after start
      expect(worker.isRunning).toBe(true);

      // act - stop worker
      worker.stop();

      // assert - not running after stop
      expect(worker.isRunning).toBe(false);
    });
  });

  describe("interval behavior - upsertIndexingMetadataContext", () => {
    it("throws when indexing metadata context is uninitialized", async () => {
      // arrange
      const indexingMetadataContext = createMockIndexingMetadataContextUninitialized();
      const ensDbClient = createMockEnsDbWriter({
        getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContext),
      });
      const worker = createMockEnsDbWriterWorker({ ensDbClient });

      // act
      await worker.run();

      // first interval tick - should error but not throw (error is caught and logged)
      await vi.advanceTimersByTimeAsync(1000);

      // assert - get should be called but upsert should not (due to error)
      expect(ensDbClient.getIndexingMetadataContext).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertIndexingMetadataContext).not.toHaveBeenCalled();

      // cleanup
      worker.stop();
    });

    it("recovers from errors and continues upserting", async () => {
      // arrange
      const omnichainSnapshot1 = createMockOmnichainSnapshot({ omnichainIndexingCursor: 100 });
      const omnichainSnapshot2 = createMockOmnichainSnapshot({ omnichainIndexingCursor: 200 });

      const crossChainSnapshot1 = createMockCrossChainSnapshot({
        slowestChainIndexingCursor: 100,
        snapshotTime: 1000,
        omnichainSnapshot: omnichainSnapshot1,
      });
      const crossChainSnapshot2 = createMockCrossChainSnapshot({
        slowestChainIndexingCursor: 200,
        snapshotTime: 2000,
        omnichainSnapshot: omnichainSnapshot2,
      });

      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain)
        .mockReturnValueOnce(crossChainSnapshot1)
        .mockReturnValueOnce(crossChainSnapshot2)
        .mockReturnValueOnce(crossChainSnapshot2);

      const indexingMetadataContext = createMockIndexingMetadataContextInitialized();
      vi.mocked(buildIndexingMetadataContextInitialized)
        .mockReturnValueOnce(indexingMetadataContext as IndexingMetadataContextInitialized)
        .mockReturnValueOnce(indexingMetadataContext as IndexingMetadataContextInitialized)
        .mockReturnValueOnce(indexingMetadataContext as IndexingMetadataContextInitialized);

      const ensDbClient = createMockEnsDbWriter({
        getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContext),
        upsertIndexingMetadataContext: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("DB error"))
          .mockResolvedValueOnce(undefined),
      });
      const indexingStatusBuilder = {
        getOmnichainIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(omnichainSnapshot1)
          .mockResolvedValueOnce(omnichainSnapshot2)
          .mockResolvedValueOnce(omnichainSnapshot2),
      } as unknown as IndexingStatusBuilder;
      const worker = createMockEnsDbWriterWorker({ ensDbClient, indexingStatusBuilder });

      // act
      await worker.run();

      // first tick - succeeds
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(1);

      // second tick - fails with DB error, but continues
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(2);

      // third tick - succeeds again
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(3);

      // cleanup
      worker.stop();
    });

    it("builds cross-chain snapshot with correct parameters", async () => {
      // arrange
      const omnichainSnapshot = createMockOmnichainSnapshot({
        omnichainIndexingCursor: 500,
      });
      const indexingMetadataContext = createMockIndexingMetadataContextInitialized();
      const ensDbClient = createMockEnsDbWriter({
        getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContext),
      });
      const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshot);
      const worker = createMockEnsDbWriterWorker({ ensDbClient, indexingStatusBuilder });

      // act
      await worker.run();
      await vi.advanceTimersByTimeAsync(1000);

      // assert
      expect(buildCrossChainIndexingStatusSnapshotOmnichain).toHaveBeenCalledWith(
        omnichainSnapshot,
        expect.any(Number),
      );

      // cleanup
      worker.stop();
    });

    it("calls upsertIndexingMetadataContext with built context", async () => {
      // arrange
      const omnichainSnapshot = createMockOmnichainSnapshot();
      const crossChainSnapshot = createMockCrossChainSnapshot({ omnichainSnapshot });
      const indexingMetadataContext = createMockIndexingMetadataContextInitialized();

      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(crossChainSnapshot);
      vi.mocked(buildIndexingMetadataContextInitialized).mockReturnValue(
        indexingMetadataContext as IndexingMetadataContextInitialized,
      );

      const ensDbClient = createMockEnsDbWriter({
        getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContext),
      });
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingStatusBuilder: createMockIndexingStatusBuilder(omnichainSnapshot),
      });

      // act
      await worker.run();
      await vi.advanceTimersByTimeAsync(1000);

      // assert
      expect(buildIndexingMetadataContextInitialized).toHaveBeenCalledWith(
        crossChainSnapshot,
        (indexingMetadataContext as IndexingMetadataContextInitialized).stackInfo,
      );
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledWith(
        indexingMetadataContext,
      );

      // cleanup
      worker.stop();
    });
  });
});
