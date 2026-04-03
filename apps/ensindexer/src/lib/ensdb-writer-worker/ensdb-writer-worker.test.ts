import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  OmnichainIndexingStatusIds,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import "@/lib/__test__/mockLogger";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import type { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

import {
  createMockCrossChainSnapshot,
  createMockEnsDbWriter,
  createMockEnsDbWriterWorker,
  createMockIndexingStatusBuilder,
  createMockOmnichainSnapshot,
  createMockPublicConfigBuilder,
  mockPublicConfig,
} from "./ensdb-writer-worker.mock";

vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual = await vi.importActual("@ensnode/ensnode-sdk");

  return {
    ...actual,
    validateEnsIndexerPublicConfigCompatibility: vi.fn(),
    buildCrossChainIndexingStatusSnapshotOmnichain: vi.fn(),
  };
});

vi.mock("p-retry", () => ({
  default: vi.fn((fn) => fn()),
}));

describe("EnsDbWriterWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("run() - worker initialization", () => {
    it("upserts version, config, and starts interval for indexing status snapshots", async () => {
      // arrange
      const omnichainSnapshot = createMockOmnichainSnapshot();
      const snapshot = createMockCrossChainSnapshot({ omnichainSnapshot });
      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(snapshot);

      const ensDbClient = createMockEnsDbWriter();
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        indexingStatusBuilder: createMockIndexingStatusBuilder(omnichainSnapshot),
      });

      // act
      await worker.run();

      // assert - verify initial upserts happened
      expect(ensDbClient.upsertEnsDbVersion).toHaveBeenCalledWith(
        mockPublicConfig.versionInfo.ensDb,
      );
      expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(mockPublicConfig);

      // advance time to trigger interval
      await vi.advanceTimersByTimeAsync(1000);

      // assert - snapshot should be upserted
      expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(snapshot);
      expect(buildCrossChainIndexingStatusSnapshotOmnichain).toHaveBeenCalledWith(
        omnichainSnapshot,
        expect.any(Number),
      );

      // cleanup
      worker.stop();
    });

    it("throws when stored config is incompatible", async () => {
      // arrange
      vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
        throw new Error("incompatible");
      });

      const ensDbClient = createMockEnsDbWriter({
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockPublicConfig),
      });
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        publicConfigBuilder: createMockPublicConfigBuilder(mockPublicConfig),
      });

      // act & assert
      await expect(worker.run()).rejects.toThrow("incompatible");
      expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
    });

    it("skips config validation when in dev mode", async () => {
      // arrange
      vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
        throw new Error("incompatible");
      });

      const snapshot = createMockCrossChainSnapshot();
      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(snapshot);

      const ensDbClient = createMockEnsDbWriter({
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockPublicConfig),
      });
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        publicConfigBuilder: createMockPublicConfigBuilder(mockPublicConfig),
        isInDevMode: true,
      });

      // act - should not throw even though configs are incompatible
      await worker.run();

      // assert - validation should not have been called
      expect(validateEnsIndexerPublicConfigCompatibility).not.toHaveBeenCalled();
      expect(ensDbClient.upsertEnsDbVersion).toHaveBeenCalledWith(
        mockPublicConfig.versionInfo.ensDb,
      );
      expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(mockPublicConfig);

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

    it("throws error when config fetch fails", async () => {
      // arrange
      const publicConfigBuilder = {
        getPublicConfig: vi.fn().mockRejectedValue(new Error("Network failure")),
      } as unknown as PublicConfigBuilder;
      const ensDbClient = createMockEnsDbWriter();
      const worker = createMockEnsDbWriterWorker({ ensDbClient, publicConfigBuilder });

      // act & assert
      await expect(worker.run()).rejects.toThrow("Network failure");
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
    });

    it("throws error when stored config fetch fails", async () => {
      // arrange
      const ensDbClient = createMockEnsDbWriter({
        getEnsIndexerPublicConfig: vi.fn().mockRejectedValue(new Error("Database connection lost")),
      });
      const worker = createMockEnsDbWriterWorker({ ensDbClient });

      // act & assert
      await expect(worker.run()).rejects.toThrow("Database connection lost");
      expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
    });

    it("fetches stored and in-memory configs concurrently", async () => {
      // arrange
      vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {});

      const ensDbClient = createMockEnsDbWriter({
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockPublicConfig),
      });
      const publicConfigBuilder = createMockPublicConfigBuilder(mockPublicConfig);
      const worker = createMockEnsDbWriterWorker({
        ensDbClient,
        publicConfigBuilder,
      });

      // act
      await worker.run();

      // assert - both should have been called (concurrent execution via Promise.all)
      expect(ensDbClient.getEnsIndexerPublicConfig).toHaveBeenCalledTimes(1);
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledTimes(1);

      // cleanup
      worker.stop();
    });

    it("calls pRetry for config fetch with retry logic", async () => {
      // arrange - pRetry is mocked to call fn directly
      const snapshot = createMockCrossChainSnapshot();
      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(snapshot);

      const ensDbClient = createMockEnsDbWriter();
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const worker = createMockEnsDbWriterWorker({ ensDbClient, publicConfigBuilder });

      // act
      await worker.run();

      // assert - config should be called once (pRetry is mocked)
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(mockPublicConfig);

      // cleanup
      worker.stop();
    });
  });

  describe("stop() - worker termination", () => {
    it("stops the interval when stop() is called", async () => {
      // arrange
      const upsertIndexingStatusSnapshot = vi.fn().mockResolvedValue(undefined);
      const ensDbClient = createMockEnsDbWriter({ upsertIndexingStatusSnapshot });
      const worker = createMockEnsDbWriterWorker({ ensDbClient });

      // act
      await worker.run();
      await vi.advanceTimersByTimeAsync(1000);

      const callCountBeforeStop = upsertIndexingStatusSnapshot.mock.calls.length;

      worker.stop();

      // advance time after stop
      await vi.advanceTimersByTimeAsync(2000);

      // assert - no more calls after stop
      expect(upsertIndexingStatusSnapshot).toHaveBeenCalledTimes(callCountBeforeStop);
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

  describe("interval behavior - snapshot upserts", () => {
    it("continues upserting after snapshot validation errors", async () => {
      // arrange
      const unstartedSnapshot = createMockOmnichainSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
      });
      const validSnapshot = createMockOmnichainSnapshot({
        omnichainIndexingCursor: 200,
      });
      const crossChainSnapshot = createMockCrossChainSnapshot({
        slowestChainIndexingCursor: 200,
        snapshotTime: 300,
        omnichainSnapshot: validSnapshot,
      });

      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(crossChainSnapshot);

      const ensDbClient = createMockEnsDbWriter();
      const indexingStatusBuilder = {
        getOmnichainIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(unstartedSnapshot)
          .mockResolvedValueOnce(validSnapshot),
      } as unknown as IndexingStatusBuilder;
      const worker = createMockEnsDbWriterWorker({ ensDbClient, indexingStatusBuilder });

      // act - run returns immediately
      await worker.run();

      // first interval tick - should error but not throw
      await vi.advanceTimersByTimeAsync(1000);

      // second interval tick - should succeed
      await vi.advanceTimersByTimeAsync(1000);

      // assert
      expect(indexingStatusBuilder.getOmnichainIndexingStatusSnapshot).toHaveBeenCalledTimes(2);
      expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(crossChainSnapshot);

      // cleanup
      worker.stop();
    });

    it("recovers from errors and continues upserting snapshots", async () => {
      // arrange
      const snapshot1 = createMockOmnichainSnapshot({ omnichainIndexingCursor: 100 });
      const snapshot2 = createMockOmnichainSnapshot({ omnichainIndexingCursor: 200 });

      const crossChainSnapshot1 = createMockCrossChainSnapshot({
        slowestChainIndexingCursor: 100,
        snapshotTime: 1000,
        omnichainSnapshot: snapshot1,
      });
      const crossChainSnapshot2 = createMockCrossChainSnapshot({
        slowestChainIndexingCursor: 200,
        snapshotTime: 2000,
        omnichainSnapshot: snapshot2,
      });

      vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain)
        .mockReturnValueOnce(crossChainSnapshot1)
        .mockReturnValueOnce(crossChainSnapshot2)
        .mockReturnValueOnce(crossChainSnapshot2);

      const ensDbClient = createMockEnsDbWriter({
        upsertIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("DB error"))
          .mockResolvedValueOnce(undefined),
      });
      const indexingStatusBuilder = {
        getOmnichainIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(snapshot1)
          .mockResolvedValueOnce(snapshot2)
          .mockResolvedValueOnce(snapshot2),
      } as unknown as IndexingStatusBuilder;
      const worker = createMockEnsDbWriterWorker({ ensDbClient, indexingStatusBuilder });

      // act
      await worker.run();

      // first tick - succeeds
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(crossChainSnapshot1);

      // second tick - fails with DB error, but continues
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenLastCalledWith(
        crossChainSnapshot2,
      );

      // third tick - succeeds again
      await vi.advanceTimersByTimeAsync(1000);
      expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledTimes(3);

      // cleanup
      worker.stop();
    });
  });
});
