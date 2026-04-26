import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EnsDbReader } from "@ensnode/ensdb-sdk";
import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  buildIndexingMetadataContextInitialized,
  type CrossChainIndexingStatusSnapshot,
  type EnsIndexerStackInfo,
  type IndexingMetadataContext,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  validateEnsIndexerPublicConfigCompatibility,
} from "@ensnode/ensnode-sdk";

import "@/lib/__test__/mockLogger";

import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder/indexing-status-builder";
import type { StackInfoBuilder } from "@/lib/stack-info-builder/stack-info-builder";

import { IndexingMetadataContextBuilder } from "./indexing-metadata-context-builder";

vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual = await vi.importActual("@ensnode/ensnode-sdk");

  return {
    ...actual,
    buildCrossChainIndexingStatusSnapshotOmnichain: vi.fn(),
    buildIndexingMetadataContextInitialized: vi.fn(),
    validateEnsIndexerPublicConfigCompatibility: vi.fn(),
  };
});

const omnichainSnapshotUnstarted: OmnichainIndexingStatusSnapshot = {
  omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
  omnichainIndexingCursor: 0,
  chains: new Map(),
};

const omnichainSnapshotFollowing: OmnichainIndexingStatusSnapshot = {
  omnichainStatus: OmnichainIndexingStatusIds.Following,
  omnichainIndexingCursor: 100,
  chains: new Map(),
};

const crossChainSnapshot: CrossChainIndexingStatusSnapshot = {
  strategy: "omnichain" as any,
  slowestChainIndexingCursor: 100,
  snapshotTime: 200,
  omnichainSnapshot: omnichainSnapshotFollowing,
};

const stackInfo: EnsIndexerStackInfo = {
  ensDb: { versionInfo: { postgresql: "17.4" } },
  ensIndexer: {} as any,
  ensRainbow: {} as any,
};

const indexingMetadataContextInitialized: IndexingMetadataContextInitialized = {
  statusCode: IndexingMetadataContextStatusCodes.Initialized,
  indexingStatus: crossChainSnapshot,
  stackInfo,
};

const indexingMetadataContextUninitialized: IndexingMetadataContext = {
  statusCode: IndexingMetadataContextStatusCodes.Uninitialized,
};

function createMockEnsDbReader(
  overrides: Partial<Pick<EnsDbReader, "getIndexingMetadataContext">> = {},
): EnsDbReader {
  return {
    getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextUninitialized),
    ...overrides,
  } as unknown as EnsDbReader;
}

function createMockIndexingStatusBuilder(
  resolvedSnapshot: OmnichainIndexingStatusSnapshot = omnichainSnapshotUnstarted,
): IndexingStatusBuilder {
  return {
    getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(resolvedSnapshot),
  } as unknown as IndexingStatusBuilder;
}

function createMockStackInfoBuilder(
  resolvedStackInfo: EnsIndexerStackInfo = stackInfo,
): StackInfoBuilder {
  return {
    getStackInfo: vi.fn().mockResolvedValue(resolvedStackInfo),
  } as unknown as StackInfoBuilder;
}

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

        const builder = new IndexingMetadataContextBuilder(
          ensDbClient,
          indexingStatusBuilder,
          stackInfoBuilder,
        );
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

        const builder = new IndexingMetadataContextBuilder(
          createMockEnsDbReader(),
          indexingStatusBuilder,
          createMockStackInfoBuilder(),
        );

        await expect(builder.getIndexingMetadataContext()).rejects.toThrow(
          /Omnichain indexing status must be "unstarted"/,
        );
      });
    });

    describe("when stored context is Initialized", () => {
      it("builds and returns initialized context after validating compatibility", async () => {
        const ensDbClient = createMockEnsDbReader({
          getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextInitialized),
        });
        const indexingStatusBuilder = createMockIndexingStatusBuilder(omnichainSnapshotFollowing);
        const stackInfoBuilder = createMockStackInfoBuilder();

        const builder = new IndexingMetadataContextBuilder(
          ensDbClient,
          indexingStatusBuilder,
          stackInfoBuilder,
        );
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

      it("throws when stored and in-memory configs are incompatible", async () => {
        vi.mocked(validateEnsIndexerPublicConfigCompatibility).mockImplementation(() => {
          throw new Error("Incompatible ENSIndexer config");
        });

        const ensDbClient = createMockEnsDbReader({
          getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextInitialized),
        });

        const builder = new IndexingMetadataContextBuilder(
          ensDbClient,
          createMockIndexingStatusBuilder(omnichainSnapshotFollowing),
          createMockStackInfoBuilder(),
        );

        await expect(builder.getIndexingMetadataContext()).rejects.toThrow(
          "Incompatible ENSIndexer config",
        );
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

      const builder = new IndexingMetadataContextBuilder(
        ensDbClient,
        indexingStatusBuilder,
        stackInfoBuilder,
      );
      await builder.getIndexingMetadataContext();

      // All three should have been called (ordering is not deterministic for parallel)
      expect(resolveOrder).toHaveLength(3);
      expect(resolveOrder).toContain("ensDb");
      expect(resolveOrder).toContain("indexingStatus");
      expect(resolveOrder).toContain("stackInfo");
    });
  });
});
