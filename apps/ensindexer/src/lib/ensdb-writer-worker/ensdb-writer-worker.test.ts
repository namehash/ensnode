import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "@/lib/__test__/mockLogger";

import {
  createMockEnsDbWriter,
  createMockEnsDbWriterWorker,
  createMockIndexingMetadataContextBuilder,
  createMockIndexingMetadataContextInitialized,
} from "./ensdb-writer-worker.mock";

describe("EnsDbWriterWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("run() - worker initialization", () => {
    it("starts the interval for updating indexing metadata context", async () => {
      // arrange
      const context = createMockIndexingMetadataContextInitialized();
      const indexingMetadataContextBuilder = createMockIndexingMetadataContextBuilder(context);

      const ensDbClient = createMockEnsDbWriter();
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingMetadataContextBuilder,
      });

      // act
      await worker.run();

      // advance time to trigger interval
      await vi.advanceTimersByTimeAsync(1000);

      // assert - worker delegates to indexingMetadataContextBuilder
      expect(indexingMetadataContextBuilder.getIndexingMetadataContext).toHaveBeenCalled();
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledWith(context);

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
      const upsertIndexingMetadataContext = vi.fn().mockResolvedValue(undefined);
      const ensDbClient = createMockEnsDbWriter({ upsertIndexingMetadataContext });
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

  describe("interval behavior - updateIndexingMetadataContext", () => {
    it("calls getIndexingMetadataContext and upserts on each tick", async () => {
      // arrange
      const context1 = createMockIndexingMetadataContextInitialized();
      const context2 = createMockIndexingMetadataContextInitialized();

      const indexingMetadataContextBuilder = createMockIndexingMetadataContextBuilder(context1);
      (indexingMetadataContextBuilder.getIndexingMetadataContext as any)
        .mockResolvedValueOnce(context1)
        .mockResolvedValueOnce(context2);

      const ensDbClient = createMockEnsDbWriter();
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingMetadataContextBuilder,
      });

      // act
      await worker.run();

      // first tick
      await vi.advanceTimersByTimeAsync(1000);
      expect(indexingMetadataContextBuilder.getIndexingMetadataContext).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledWith(context1);

      // second tick
      await vi.advanceTimersByTimeAsync(1000);
      expect(indexingMetadataContextBuilder.getIndexingMetadataContext).toHaveBeenCalledTimes(2);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledWith(context2);

      // cleanup
      worker.stop();
    });

    it("recovers from getIndexingMetadataContext errors between ticks", async () => {
      // arrange
      const context = createMockIndexingMetadataContextInitialized();
      const indexingMetadataContextBuilder = createMockIndexingMetadataContextBuilder(context);
      (indexingMetadataContextBuilder.getIndexingMetadataContext as any)
        .mockResolvedValueOnce(context)
        .mockRejectedValueOnce(new Error("Builder error"))
        .mockResolvedValueOnce(context);

      const ensDbClient = createMockEnsDbWriter();
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingMetadataContextBuilder,
      });

      // act
      await worker.run();

      // first tick - succeeds
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(1);

      // second tick - builder error, swallowed, no upsert
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(1); // no new upsert

      // third tick - succeeds again
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(2);

      // cleanup
      worker.stop();
    });

    it("recovers from upsertIndexingMetadataContext errors between ticks", async () => {
      // arrange
      const context = createMockIndexingMetadataContextInitialized();
      const indexingMetadataContextBuilder = createMockIndexingMetadataContextBuilder(context);

      const ensDbClient = createMockEnsDbWriter({
        upsertIndexingMetadataContext: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("DB error"))
          .mockResolvedValueOnce(undefined),
      });

      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingMetadataContextBuilder,
      });

      // act
      await worker.run();

      // first tick - succeeds
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(1);

      // second tick - DB error, swallowed, upsert was called but rejected
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(2);

      // third tick - succeeds again
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingMetadataContext).toHaveBeenCalledTimes(3);

      // cleanup
      worker.stop();
    });

    it("does not stop worker or set exitCode on error", async () => {
      // arrange
      const indexingMetadataContextBuilder = createMockIndexingMetadataContextBuilder();
      (indexingMetadataContextBuilder.getIndexingMetadataContext as any).mockRejectedValue(
        new Error("Fatal error"),
      );

      const worker = createMockEnsDbWriterWorker({ indexingMetadataContextBuilder });

      // reset exitCode before test
      process.exitCode = undefined;

      // act
      await worker.run();
      await vi.advanceTimersByTimeAsync(1000);

      // assert - error is swallowed, worker keeps running, no exitCode set
      expect(worker.isRunning).toBe(true);
      expect(process.exitCode).toBeUndefined();

      // cleanup
      worker.stop();
    });
  });
});
