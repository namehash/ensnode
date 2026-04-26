import { vi } from "vitest";

import type { EnsDbWriter } from "@ensnode/ensdb-sdk";
import {
  ChainIndexingStatusIds,
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  RangeTypeIds,
} from "@ensnode/ensnode-sdk";

import { EnsDbWriterWorker } from "@/lib/ensdb-writer-worker/ensdb-writer-worker";
import type { IndexingMetadataContextBuilder } from "@/lib/indexing-metadata-context-builder/indexing-metadata-context-builder";

// Test fixtures for IndexingMetadataContext objects

export function createMockCrossChainSnapshot(
  overrides: Partial<CrossChainIndexingStatusSnapshot> = {},
): CrossChainIndexingStatusSnapshot {
  return {
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: 100,
    snapshotTime: 200,
    omnichainSnapshot: {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: 100,
      chains: new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            latestIndexedBlock: { timestamp: 100, number: 100 },
            latestKnownBlock: { timestamp: 200, number: 200 },
            config: {
              rangeType: RangeTypeIds.LeftBounded,
              startBlock: { timestamp: 0, number: 0 },
            },
          },
        ],
      ]),
    },
    ...overrides,
  };
}

export function createMockIndexingMetadataContextInitialized(
  overrides: Partial<IndexingMetadataContextInitialized> = {},
): IndexingMetadataContextInitialized {
  return {
    statusCode: IndexingMetadataContextStatusCodes.Initialized,
    indexingStatus: createMockCrossChainSnapshot(),
    stackInfo: {
      ensDb: { versionInfo: { postgresql: "17.4" } },
      ensIndexer: {} as any,
      ensRainbow: {} as any,
    },
    ...overrides,
  };
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

export function createMockEnsDbWriter(
  overrides: Partial<Pick<EnsDbWriter, "upsertIndexingMetadataContext">> = {},
): EnsDbWriter {
  return {
    upsertIndexingMetadataContext: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as EnsDbWriter;
}

export function createMockIndexingMetadataContextBuilder(
  resolvedContext: IndexingMetadataContextInitialized = createMockIndexingMetadataContextInitialized(),
): IndexingMetadataContextBuilder {
  return {
    getIndexingMetadataContext: vi.fn().mockResolvedValue(resolvedContext),
  } as unknown as IndexingMetadataContextBuilder;
}

export function createMockEnsDbWriterWorker(
  overrides: {
    ensDbClient?: EnsDbWriter;
    indexingMetadataContextBuilder?: IndexingMetadataContextBuilder;
  } = {},
) {
  const ensDbClient = overrides.ensDbClient ?? createMockEnsDbWriter();
  const indexingMetadataContextBuilder =
    overrides.indexingMetadataContextBuilder ?? createMockIndexingMetadataContextBuilder();

  return new EnsDbWriterWorker(ensDbClient, indexingMetadataContextBuilder);
}
