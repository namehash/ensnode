import { vi } from "vitest";

import type { EnsDbWriter } from "@ensnode/ensdb-sdk";
import {
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
  ENSNamespaceIds,
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  type EnsRainbowPublicConfig,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  PluginName,
} from "@ensnode/ensnode-sdk";
import type { LocalPonderClient } from "@ensnode/ponder-sdk";

import { EnsDbWriterWorker } from "@/lib/ensdb-writer-worker/ensdb-writer-worker";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder";
import type { PublicConfigBuilder } from "@/lib/public-config-builder";

// Test fixture for EnsRainbowPublicConfig
export const mockEnsRainbowPublicConfig: EnsRainbowPublicConfig = {
  version: "1.0.0",
  labelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
  recordsCount: 1000,
};

// Test fixture for EnsIndexerVersionInfo
export const mockVersionInfo: EnsIndexerVersionInfo = {
  nodejs: "20.0.0",
  ponder: "0.9.0",
  ensDb: "1.0.0",
  ensIndexer: "1.0.0",
  ensNormalize: "1.10.0",
};

// Test fixture for EnsIndexerPublicConfig
export const mockPublicConfig: EnsIndexerPublicConfig = {
  databaseSchemaName: "public",
  labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  ensRainbowPublicConfig: mockEnsRainbowPublicConfig,
  indexedChainIds: new Set([1, 8453]),
  isSubgraphCompatible: true,
  namespace: ENSNamespaceIds.Mainnet,
  plugins: [PluginName.Subgraph],
  versionInfo: mockVersionInfo,
};

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
    getEnsDbVersion: vi.fn().mockResolvedValue(undefined),
    getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
    getIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
    upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
    upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockPublicConfigBuilder(
  resolvedConfig: EnsIndexerPublicConfig = mockPublicConfig,
): PublicConfigBuilder {
  return {
    getPublicConfig: vi.fn().mockResolvedValue(resolvedConfig),
  } as unknown as PublicConfigBuilder;
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

export function createMockLocalPonderClient(
  overrides: { isInDevMode?: boolean } = {},
): LocalPonderClient {
  const isInDevMode = overrides.isInDevMode ?? false;

  return {
    isInDevMode,
  } as unknown as LocalPonderClient;
}

export function createMockEnsDbWriterWorker(
  overrides: {
    ensDbClient?: EnsDbWriter;
    publicConfigBuilder?: PublicConfigBuilder;
    indexingStatusBuilder?: IndexingStatusBuilder;
    isInDevMode?: boolean;
  } = {},
) {
  const ensDbClient = overrides.ensDbClient ?? createMockEnsDbWriter();
  const publicConfigBuilder = overrides.publicConfigBuilder ?? createMockPublicConfigBuilder();
  const indexingStatusBuilder =
    overrides.indexingStatusBuilder ?? createMockIndexingStatusBuilder();
  const localPonderClient = createMockLocalPonderClient({
    isInDevMode: overrides.isInDevMode ?? false,
  });

  return new EnsDbWriterWorker(
    ensDbClient,
    publicConfigBuilder,
    indexingStatusBuilder,
    localPonderClient,
  );
}
