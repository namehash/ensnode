import { vi } from "vitest";

import type { EnsDbReader } from "@ensnode/ensdb-sdk";
import {
  type CrossChainIndexingStatusSnapshot,
  type EnsIndexerStackInfo,
  type IndexingMetadataContext,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import type { LocalPonderClient } from "@ensnode/ponder-sdk";

import { IndexingMetadataContextBuilder } from "@/lib/indexing-metadata-context-builder/indexing-metadata-context-builder";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder";
import type { StackInfoBuilder } from "@/lib/stack-info-builder";

export const omnichainSnapshotUnstarted: OmnichainIndexingStatusSnapshot = {
  omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
  omnichainIndexingCursor: 0,
  chains: new Map(),
};

export const omnichainSnapshotFollowing: OmnichainIndexingStatusSnapshot = {
  omnichainStatus: OmnichainIndexingStatusIds.Following,
  omnichainIndexingCursor: 100,
  chains: new Map(),
};

export const crossChainSnapshot: CrossChainIndexingStatusSnapshot = {
  strategy: "omnichain" as any,
  slowestChainIndexingCursor: 100,
  snapshotTime: 200,
  omnichainSnapshot: omnichainSnapshotFollowing,
};

export const stackInfo: EnsIndexerStackInfo = {
  ensDb: { versionInfo: { postgresql: "17.4" } },
  ensIndexer: {} as any,
  ensRainbow: {} as any,
};

export const indexingMetadataContextInitialized: IndexingMetadataContextInitialized = {
  statusCode: IndexingMetadataContextStatusCodes.Initialized,
  indexingStatus: crossChainSnapshot,
  stackInfo,
};

export const indexingMetadataContextUninitialized: IndexingMetadataContext = {
  statusCode: IndexingMetadataContextStatusCodes.Uninitialized,
};

export function createMockEnsDbReader(
  overrides: Partial<Pick<EnsDbReader, "getIndexingMetadataContext">> = {},
): EnsDbReader {
  return {
    getIndexingMetadataContext: vi.fn().mockResolvedValue(indexingMetadataContextUninitialized),
    ...overrides,
  } as unknown as EnsDbReader;
}

export function createMockIndexingStatusBuilder(
  resolvedSnapshot: OmnichainIndexingStatusSnapshot = omnichainSnapshotUnstarted,
): IndexingStatusBuilder {
  return {
    getOmnichainIndexingStatusSnapshot: vi.fn().mockResolvedValue(resolvedSnapshot),
  } as unknown as IndexingStatusBuilder;
}

export function createMockStackInfoBuilder(
  resolvedStackInfo: EnsIndexerStackInfo = stackInfo,
): StackInfoBuilder {
  return {
    getStackInfo: vi.fn().mockResolvedValue(resolvedStackInfo),
  } as unknown as StackInfoBuilder;
}

export function createMockLocalPonderClient(
  options: { isInDevMode?: boolean } = {},
): LocalPonderClient {
  return {
    isInDevMode: options.isInDevMode ?? false,
  } as unknown as LocalPonderClient;
}

export function createIndexingMetadataContextBuilder(
  overrides: {
    ensDbClient?: EnsDbReader;
    indexingStatusBuilder?: IndexingStatusBuilder;
    stackInfoBuilder?: StackInfoBuilder;
    localPonderClient?: LocalPonderClient;
  } = {},
): IndexingMetadataContextBuilder {
  return new IndexingMetadataContextBuilder(
    overrides.ensDbClient ?? createMockEnsDbReader(),
    overrides.indexingStatusBuilder ?? createMockIndexingStatusBuilder(),
    overrides.stackInfoBuilder ?? createMockStackInfoBuilder(),
    overrides.localPonderClient ?? createMockLocalPonderClient(),
  );
}
