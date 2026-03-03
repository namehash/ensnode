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
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(null),
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
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(null),
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
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(null),
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
      .mockReturnValueOnce(crossChainSnapshot2);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(null),
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
