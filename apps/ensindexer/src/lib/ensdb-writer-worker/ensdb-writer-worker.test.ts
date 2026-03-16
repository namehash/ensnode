import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  OmnichainIndexingStatusIds,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import * as ensDbClientMock from "@/lib/ensdb-client/ensdb-client.mock";
import { EnsDbWriterWorker } from "@/lib/ensdb-writer-worker/ensdb-writer-worker";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import type { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

import {
  createMockCrossChainSnapshot,
  createMockEnsDbClient,
  createMockIndexingStatusBuilder,
  createMockOmnichainSnapshot,
  createMockPublicConfigBuilder,
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

      const ensDbClient = createMockEnsDbClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshot);

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

      // act
      await worker.run();

      // assert - verify initial upserts happened
      expect(ensDbClient.upsertEnsDbVersion).toHaveBeenCalledWith(
        ensDbClientMock.publicConfig.versionInfo.ensDb,
      );
      expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(
        ensDbClientMock.publicConfig,
      );

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
      const incompatibleError = new Error("incompatible");
      vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
        throw incompatibleError;
      });

      const ensDbClient = createMockEnsDbClient({
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(ensDbClientMock.publicConfig),
      });
      const publicConfigBuilder = createMockPublicConfigBuilder(ensDbClientMock.publicConfig);
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

      // act & assert
      await expect(worker.run()).rejects.toThrow("incompatible");
      expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
    });

    it("throws error when worker is already running", async () => {
      // arrange
      const ensDbClient = createMockEnsDbClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

      // act - first run
      await worker.run();

      // assert - second run should throw
      await expect(worker.run()).rejects.toThrow("EnsDbWriterWorker is already running");

      // cleanup
      worker.stop();
    });

    it("throws error when config fetch fails", async () => {
      // arrange
      const networkError = new Error("Network failure");
      const ensDbClient = createMockEnsDbClient();
      const publicConfigBuilder = {
        getPublicConfig: vi.fn().mockRejectedValue(networkError),
      } as unknown as PublicConfigBuilder;
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

      // act & assert
      await expect(worker.run()).rejects.toThrow("Network failure");
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
    });

    it("throws error when stored config fetch fails", async () => {
      // arrange
      const dbError = new Error("Database connection lost");
      const ensDbClient = createMockEnsDbClient({
        getEnsIndexerPublicConfig: vi.fn().mockRejectedValue(dbError),
      });
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

      // act & assert
      await expect(worker.run()).rejects.toThrow("Database connection lost");
      expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
    });

    it("fetches stored and in-memory configs concurrently", async () => {
      // arrange
      vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
        // validation passes
      });

      const ensDbClient = createMockEnsDbClient({
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(ensDbClientMock.publicConfig),
      });
      const publicConfigBuilder = createMockPublicConfigBuilder(ensDbClientMock.publicConfig);
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

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

      const ensDbClient = createMockEnsDbClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

      // act
      await worker.run();

      // assert - config should be called once (pRetry is mocked)
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledTimes(1);
      expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(
        ensDbClientMock.publicConfig,
      );

      // cleanup
      worker.stop();
    });
  });

  describe("stop() - worker termination", () => {
    it("stops the interval when stop() is called", async () => {
      // arrange
      const upsertIndexingStatusSnapshot = vi.fn().mockResolvedValue(undefined);
      const ensDbClient = createMockEnsDbClient({ upsertIndexingStatusSnapshot });
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

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
      const ensDbClient = createMockEnsDbClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = createMockIndexingStatusBuilder();

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

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

      const ensDbClient = createMockEnsDbClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = {
        getOmnichainIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(unstartedSnapshot)
          .mockResolvedValueOnce(validSnapshot),
      } as unknown as IndexingStatusBuilder;

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

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

      const ensDbClient = createMockEnsDbClient({
        upsertIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("DB error"))
          .mockResolvedValueOnce(undefined),
      });
      const publicConfigBuilder = createMockPublicConfigBuilder();
      const indexingStatusBuilder = {
        getOmnichainIndexingStatusSnapshot: vi
          .fn()
          .mockResolvedValueOnce(snapshot1)
          .mockResolvedValueOnce(snapshot2)
          .mockResolvedValueOnce(snapshot2),
      } as unknown as IndexingStatusBuilder;

      const worker = new EnsDbWriterWorker(ensDbClient, publicConfigBuilder, indexingStatusBuilder);

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
