import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
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
import { buildCrossChainIndexingStatusSnapshotOmnichain } from "@/lib/indexing-status-builder/cross-chain-indexing-status-snapshot";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";

vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual =
    await vi.importActual<typeof import("@ensnode/ensnode-sdk")>("@ensnode/ensnode-sdk");

  return {
    ...actual,
    validateEnsIndexerPublicConfigCompatibility: vi.fn(),
  };
});

vi.mock("@/lib/indexing-status-builder/cross-chain-indexing-status-snapshot", () => ({
  buildCrossChainIndexingStatusSnapshotOmnichain: vi.fn(),
}));

describe("EnsDbWriterWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("upserts version, config, and indexing status snapshots", async () => {
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
      upsertIndexingStatusSnapshot: vi.fn(),
    } as unknown as EnsDbClient;

    const ensIndexerClient = {
      config: vi.fn().mockResolvedValue(publicConfig),
    } as unknown as EnsIndexerClient;

    const indexingStatusBuilder = {
      getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(omnichainSnapshot),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    vi.mocked(ensDbClient.upsertIndexingStatusSnapshot).mockImplementation(async () => {
      worker.stop();
    });

    // act
    const runPromise = worker.run();

    await vi.runAllTimersAsync();
    await runPromise;

    // assert
    expect(ensDbClient.upsertEnsDbVersion).toHaveBeenCalledWith(publicConfig.versionInfo.ensDb);
    expect(ensDbClient.upsertEnsIndexerPublicConfig).toHaveBeenCalledWith(publicConfig);
    expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(snapshot);
    expect(buildSnapshot).toHaveBeenCalledWith(omnichainSnapshot, expect.any(Number));
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
    await expect(worker.run()).rejects.toThrow(
      "In-memory ENSIndexer Public Config object is not compatible with its counterpart stored in ENSDb.",
    );

    // assert
    expect(ensDbClient.upsertEnsDbVersion).not.toHaveBeenCalled();
  });

  it("continues after snapshot validation errors", async () => {
    // arrange
    const unstartedSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
    } as OmnichainIndexingStatusSnapshot;

    const validSnapshot = {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 200,
      chains: {},
    } as OmnichainIndexingStatusSnapshot;

    const snapshot = {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 200,
      snapshotTime: 300,
      omnichainSnapshot: validSnapshot,
    } as CrossChainIndexingStatusSnapshot;

    vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(snapshot);

    const ensDbClient = {
      getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(null),
      upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
      upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
      upsertIndexingStatusSnapshot: vi.fn(),
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

    vi.mocked(ensDbClient.upsertIndexingStatusSnapshot).mockImplementation(async () => {
      worker.stop();
    });

    // act
    const runPromise = worker.run();

    await vi.runOnlyPendingTimersAsync();
    await vi.runOnlyPendingTimersAsync();
    await runPromise;

    // assert
    expect(indexingStatusBuilder.getOmnichainIndexingStatusSnapshot).toHaveBeenCalledTimes(2);
    expect(ensDbClient.upsertIndexingStatusSnapshot).toHaveBeenCalledWith(snapshot);
  });

  it("retries run until success", async () => {
    // arrange
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
      getOmnichainIndexingStatusSnapshot: vi.fn(),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    const runSpy = vi
      .spyOn(worker, "run")
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);

    // act
    const runPromise = worker.runWithRetries({ maxRetries: 2 });

    await vi.runOnlyPendingTimersAsync();
    await runPromise;

    // assert
    expect(runSpy).toHaveBeenCalledTimes(2);
  });

  it("throws after exceeding max retries", async () => {
    // arrange
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
      getOmnichainIndexingStatusSnapshot: vi.fn(),
    } as unknown as IndexingStatusBuilder;

    const worker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

    const error = new Error("still failing");
    vi.spyOn(worker, "run").mockRejectedValue(error);

    // act
    const runPromise = worker.runWithRetries({ maxRetries: 2 });
    const rejection = expect(runPromise).rejects.toThrow(
      "ENSDb Writer Worker failed after 2 attempts.",
    );

    await vi.runAllTimersAsync();

    // assert
    await rejection;
  });
});
