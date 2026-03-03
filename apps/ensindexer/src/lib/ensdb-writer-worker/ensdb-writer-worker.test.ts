import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
  type EnsIndexerClient,
  type EnsIndexerPublicConfig,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import type { EnsDbClient } from "@/lib/ensdb-client/ensdb-client";
import { publicConfig } from "@/lib/ensdb-client/ensdb-client.mock";
import { EnsDbWriterWorker } from "@/lib/ensdb-writer-worker/ensdb-writer-worker";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";

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

  it("upserts version, config, and starts interval for indexing status snapshots", async () => {
    // arrange
    const omnichainSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 100,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const snapshot = {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 100,
      snapshotTime: 200,
      omnichainSnapshot,
    } as CrossChainIndexingStatusSnapshot;

    const buildSnapshot = vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain);
    buildSnapshot.mockReturnValue(snapshot);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(omnichainSnapshot),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act - run() returns immediately after setting up interval
    await worker.run();

    // assert - verify initial upserts happened
    expect(ensDbClient.upsertEnsDbVersion).toHaveBeenCalledWith(publicConfig.versionInfo.ensDb);
    expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(publicConfig);

    // advance time to trigger interval
    await vi.advanceTimersByTimeAsync(1000);

    // assert - snapshot should be upserted
    expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(snapshot);
    expect(buildSnapshot).toHaveBeenCalledWith(omnichainSnapshot, expect.any(Number));

    // cleanup
    worker.stop();
  });

  it("throws when stored config is incompatible", async () => {
    // arrange
    const incompatibleError = new Error("incompatible");

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(publicConfig),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig as EnsIndexerPublicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn(),
    } as unknown as IndexingStatusBuilder;

    vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
      throw incompatibleError;
    });

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act
    await expect(worker.run()).rejects.toThrow("incompatible");

    // assert
    expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
  });

  it("continues upserting after snapshot validation errors", async () => {
    // arrange
    const unstartedSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
    } as OmnichainIndexingStatusSnapshot;

    const validSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 200,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const crossChainSnapshot = {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 200,
      snapshotTime: 300,
      omnichainSnapshot: validSnapshot,
    } as CrossChainIndexingStatusSnapshot;

    vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(crossChainSnapshot);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi
        .fn()
        .mockResolvedValueOnce(unstartedSnapshot)
        .mockResolvedValueOnce(validSnapshot),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

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

  it("stops the interval when stop() is called", async () => {
    // arrange
    const omnichainSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 100,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const upsertIndexingStatusSnapshot = vi.fn().mockResolvedValue(undefined);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot,
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(omnichainSnapshot),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

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

  it("calls pRetry for config fetch with retry logic", async () => {
    // arrange - pRetry is mocked to call fn directly
    const omnichainSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 100,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const snapshot = {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 100,
      snapshotTime: 200,
      omnichainSnapshot,
    } as CrossChainIndexingStatusSnapshot;

    vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(snapshot);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(omnichainSnapshot),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act
    await worker.run();

    // assert - config should be called once (pRetry is mocked)
    expect(ensIndexerClient.config).toHaveBeenCalledTimes(1);
    expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(publicConfig);

    // cleanup
    worker.stop();
  });

  it("fetches stored and in-memory configs concurrently", async () => {
    // arrange
    const storedConfig = { ...publicConfig, versionInfo: { ...publicConfig.versionInfo } };
    const inMemoryConfig = publicConfig;

    // Ensure validation passes for this test
    vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
      // validation passes
    });

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(storedConfig),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(inMemoryConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn(),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act
    await worker.run();

    // assert - both should have been called (concurrent execution via Promise.all)
    expect(ensDbClient.getEnsIndexerPublicConfig).toHaveBeenCalledTimes(1);
    expect(ensIndexerClient.config).toHaveBeenCalledTimes(1);

    // cleanup
    worker.stop();
  });

  it("throws error when config fetch fails", async () => {
    // arrange
    const networkError = new Error("Network failure");

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockRejectedValue(networkError),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn(),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act & assert
    await expect(worker.run()).rejects.toThrow("Network failure");

    // should be called once (pRetry is mocked to call once)
    expect(ensIndexerClient.config).toHaveBeenCalledTimes(1);
    expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
  });

  it("throws error when stored config fetch fails", async () => {
    // arrange
    const dbError = new Error("Database connection lost");

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockRejectedValue(dbError),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn(),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act & assert
    await expect(worker.run()).rejects.toThrow("Database connection lost");
    expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
  });

  it("recovers from errors and continues upserting snapshots", async () => {
    // arrange
    const snapshot1 = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 100,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const snapshot2 = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 200,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const crossChainSnapshot1 = {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 100,
      snapshotTime: 1000,
      omnichainSnapshot: snapshot1,
    } as CrossChainIndexingStatusSnapshot;

    const crossChainSnapshot2 = {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 200,
      snapshotTime: 2000,
      omnichainSnapshot: snapshot2,
    } as CrossChainIndexingStatusSnapshot;

    vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain)
      .mockReturnValueOnce(crossChainSnapshot1)
      .mockReturnValueOnce(crossChainSnapshot2)
      .mockReturnValueOnce(crossChainSnapshot2);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("DB error"))
        .mockResolvedValueOnce(undefined),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi
        .fn()
        .mockResolvedValueOnce(snapshot1)
        .mockResolvedValueOnce(snapshot2)
        .mockResolvedValueOnce(snapshot2),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    // act
    await worker.run();

    // first tick - succeeds
    await vi.advanceTimersByTimeAsync(1000);
    expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(crossChainSnapshot1);

    // second tick - fails with DB error, but continues
    await vi.advanceTimersByTimeAsync(1000);
    expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenLastCalledWith(crossChainSnapshot2);

    // third tick - succeeds again
    await vi.advanceTimersByTimeAsync(1000);
    expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledTimes(3);

    // cleanup
    worker.stop();
  });
});
