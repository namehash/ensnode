import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildIndexingMetadataContextInitialized,
  type IndexingMetadataContextInitialized,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import "@/lib/__test__/mockLogger";

import {
  createIndexingMetadataContextBuilder,
  createMockEnsDbReader,
  createMockIndexingStatusBuilder,
  createMockLocalPonderClient,
  createMockStackInfoBuilder,
  crossChainSnapshot,
  indexingMetadataContextInitialized,
  indexingMetadataContextUninitialized,
  omnichainSnapshotFollowing,
  omnichainSnapshotUnstarted,
  stackInfo,
} from "@/lib/indexing-metadata-context-builder/indexing-metadata-context-builder.mock";

vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual = await vi.importActual("@ensnode/ensnode-sdk");

  return {
    ...actual,
    buildCrossChainIndexingStatusSnapshotOmnichain: vi.fn(),
    buildIndexingMetadataContextInitialized: vi.fn(),
    validateEnsIndexerPublicConfigCompatibility: vi.fn(),
  };
});

describe("IndexingMetadataContextBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(buildCrossChainIndexingStatusSnapshotOmnichain).mockReturnValue(crossChainSnapshot);
    vi.mocked(buildIndexingMetadataContextInitialized).mockReturnValue(
      indexingMetadataContextInitialized as IndexingMetadataContextInitialized,
    );
  });

  describe("getIndexingMetadataContext()", () => {
    describe("when stored context is Uninitialized", () => {
      it("builds and returns initialized context with fresh snapshot time", async () => {
        const ensDbClient = createMockEnsDbReader();
        const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshotUnstarted);
        const stackInfoBuilder = createMockStackInfoBuilder();

        const builder = createIndexingMetadataContextBuilder({
          ensDbClient,
          indexingStatusBuilder,
          stackInfoBuilder,
        });
        const result = await builder.getIndexingMetadataContext();

        expect(ensDbClient.getIndexingMetadataContext).toHaveBeenCalledOnce();
        expect(indexingStatusBuilder.getOmnichainIndexingStatusSnapshot).toHaveBeenCalledOnce();
        expect(stackInfoBuilder.getStackInfo).toHaveBeenCalledOnce();
        expect(buildCrossChainIndexingStatusSnapshotOmnichain).toHaveBeenCalledWith(
          omnichainSnapshotUnstarted,
          expect.any(Number),
        );
        expect(buildIndexingMetadataContextInitialized).toHaveBeenCalledWith(
          crossChainSnapshot,
          stackInfo,
        );
        expect(result).toBe(indexingMetadataContextInitialized);
      });

      it("throws when indexing status is not unstarted", async () => {
        const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshotFollowing);

        const builder = createIndexingMetadataContextBuilder({
          indexingStatusBuilder,
        });

        await expect(builder.getIndexingMetadataContext()).rejects.toThrow(
          /Omnichain indexing status must be "unstarted"/,
        );
      });
    });

    describe("when stored context is Initialized", () => {
      it("validates compatibility when not in dev mode", async () => {
        const ensDbClient = createMockEnsDbReader({
          getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextInitialized),
        });
        const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshotFollowing);
        const stackInfoBuilder = createMockStackInfoBuilder();
        const localPonderClient = createMockLocalPonderClient({ isInDevMode: false });

        const builder = createIndexingMetadataContextBuilder({
          ensDbClient,
          indexingStatusBuilder,
          stackInfoBuilder,
          localPonderClient,
        });
        const result = await builder.getIndexingMetadataContext();

        expect(validateEnsIndexerPublicConfigCompatibility).toHaveBeenCalledWith(
          (indexingMetadataContextInitialized as IndexingMetadataContextInitialized).stackInfo
            .ensIndexer,
          stackInfo.ensIndexer,
        );
        expect(buildIndexingMetadataContextInitialized).toHaveBeenCalledWith(
          crossChainSnapshot,
          stackInfo,
        );
        expect(result).toBe(indexingMetadataContextInitialized);
      });

      it("skips compatibility validation when in dev mode", async () => {
        const ensDbClient = createMockEnsDbReader({
          getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextInitialized),
        });
        const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshotFollowing);
        const stackInfoBuilder = createMockStackInfoBuilder();
        const localPonderClient = createMockLocalPonderClient({ isInDevMode: true });

        const builder = createIndexingMetadataContextBuilder({
          ensDbClient,
          indexingStatusBuilder,
          stackInfoBuilder,
          localPonderClient,
        });
        const result = await builder.getIndexingMetadataContext();

        // Compatibility validation should NOT be called in dev mode
        expect(validateEnsIndexerPublicConfigCompatibility).not.toHaveBeenCalled();
        expect(buildIndexingMetadataContextInitialized).toHaveBeenCalledWith(
          crossChainSnapshot,
          stackInfo,
        );
        expect(result).toBe(indexingMetadataContextInitialized);
      });

      it("throws when stored and in-memory configs are incompatible (not in dev mode)", async () => {
        vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
          throw new Error("Incompatible ENSIndexer config");
        });

        const ensDbClient = createMockEnsDbReader({
          getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextInitialized),
        });

        const builder = createIndexingMetadataContextBuilder({
          ensDbClient,
          indexingStatusBuilder: createMockIndexingStatusBuilder(omnichainSnapshotFollowing),
          localPonderClient: createMockLocalPonderClient({ isInDevMode: false }),
        });

        await expect(builder.getIndexingMetadataContext()).rejects.toThrow(
          "Incompatible ENSIndexer config",
        );
      });

      it("does not throw on incompatible configs when in dev mode", async () => {
        vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
          throw new Error("Incompatible ENSIndexer config");
        });

        const ensDbClient = createMockEnsDbReader({
          getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextInitialized),
        });

        const builder = createIndexingMetadataContextBuilder({
          ensDbClient,
          indexingStatusBuilder: createMockIndexingStatusBuilder(omnichainSnapshotFollowing),
          localPonderClient: createMockLocalPonderClient({ isInDevMode: true }),
        });

        await expect(builder.getIndexingMetadataContext()).resolves.toBeDefined();
      });
    });

    it("fetches all three data sources in parallel", async () => {
      const resolveOrder: string[] = [];
      const ensDbClient = createMockEnsDbReader({
        getIndexingMetadataContext: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 10));
          resolveOrder.push("ensDb");
          return indexingMetadataContextUninitialized;
        }),
      });
      const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshotUnstarted);
      (indexingStatusBuilder.getOmnichainIndexingStatusSnapshot as any) = vi
        .fn()
        .mockImplementation(async () => {
          resolveOrder.push("indexingStatus");
          return omnichainSnapshotUnstarted;
        });
      const stackInfoBuilder = createMockStackInfoBuilder();
      (stackInfoBuilder.getStackInfo as any) = vi.fn().mockImplementation(async () => {
        resolveOrder.push("stackInfo");
        return stackInfo;
      });

      const builder = createIndexingMetadataContextBuilder({
        ensDbClient,
        indexingStatusBuilder,
        stackInfoBuilder,
      });
      await builder.getIndexingMetadataContext();

      // All three should have been called (ordering is not deterministic for parallel)
      expect(resolveOrder).toHaveLength(3);
      expect(resolveOrder).toContain("ensDb");
      expect(resolveOrder).toContain("indexingStatus");
      expect(resolveOrder).toContain("stackInfo");
    });
  });
});
