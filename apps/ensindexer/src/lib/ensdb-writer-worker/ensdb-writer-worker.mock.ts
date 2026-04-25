import { vi } from "vitest";

import type { EnsDbWriter } from "@ensnode/ensdb-sdk";
import {
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
  type IndexingMetadataContext,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";

import { EnsDbWriterWorker } from "@/lib/ensdb-writer-worker/ensdb-writer-worker";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder";

// Test fixture for stack info - minimal valid structure for tests
export const mockStackInfo = {
  ensDb: { version: "1.0.0" },
  ensIndexer: {
    clientLabelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  },
  ensRainbow: {
    serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
    versionInfo: { ensRainbow: "1.0.0" },
  },
} as any;

// Helper to create mock objects with consistent typing
export function createMockEnsDbWriter(
  overrides: Partial<ReturnType<typeof baseEnsDbWriter>> = {},
): EnsDbWriter {
  return {
    ...baseEnsDbWriter(),
    ...overrides,
  } as unknown as EnsDbWriter;
}

export function baseEnsDbWriter() {
  return {
    getIndexingMetadataContext: vi.fn().mockResolvedValue(undefined),
    upsertIndexingMetadataContext: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockIndexingMetadataContextInitialized(
  overrides: Partial<IndexingMetadataContext> = {},
): IndexingMetadataContext {
  return {
    statusCode: IndexingMetadataContextStatusCodes.Initialized,
    indexingStatus: createMockCrossChainSnapshot(),
    stackInfo: mockStackInfo,
    ...overrides,
  };
}

export function createMockIndexingMetadataContextUninitialized(): IndexingMetadataContext {
  return {
    statusCode: IndexingMetadataContextStatusCodes.Uninitialized,
  };
}

export function createMockIndexingStatusBuilder(
  resolvedSnapshot: OmnichainIndexingStatusSnapshot = createMockOmnichainSnapshot(),
): IndexingStatusBuilder {
  return {
    getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(resolvedSnapshot),
  } as unknown as IndexingStatusBuilder;
}

export function createMockOmnichainSnapshot(
  overrides: Partial<OmnichainIndexingStatusSnapshot> = {},
): OmnichainIndexingStatusSnapshot {
  return {
    omnichainStatus: OmnichainIndexingStatusIds.Following,
    omnichainIndexingCursor: 100,
    chains: new Map(),
    ...overrides,
  };
}

export function createMockCrossChainSnapshot(
  overrides: Partial<CrossChainIndexingStatusSnapshot> = {},
): CrossChainIndexingStatusSnapshot {
  return {
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: 100,
    snapshotTime: 200,
    omnichainSnapshot: createMockOmnichainSnapshot(),
    ...overrides,
  };
}

export function createMockEnsDbWriterWorker(
  overrides: { ensDbClient?: EnsDbWriter; indexingStatusBuilder?: IndexingStatusBuilder } = {},
) {
  const ensDbClient = overrides.ensDbClient ?? createMockEnsDbWriter();
  const indexingStatusBuilder =
    overrides.indexingStatusBuilder ?? createMockIndexingStatusBuilder();

  return new EnsDbWriterWorker(ensDbClient, indexingStatusBuilder);
}
