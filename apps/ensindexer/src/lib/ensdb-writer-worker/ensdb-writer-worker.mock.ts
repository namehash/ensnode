import { vi } from "vitest";

import type { EnsNodeDbWriter } from "@ensnode/ensnode-schema";
import {
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
  type EnsIndexerPublicConfig,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { EnsDbWriterWorker } from "@/lib/ensdb-writer-worker/ensdb-writer-worker";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder";
import type { PublicConfigBuilder } from "@/lib/public-config-builder";

export const publicConfig = {
  databaseSchemaName: "ensindexer_0",
  ensRainbowPublicConfig: {
    version: "0.32.0",
    labelSet: {
      labelSetId: "subgraph",
      highestLabelSetVersion: 0,
    },
    recordsCount: 100,
  },
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: true,
  namespace: "mainnet",
  plugins: [PluginName.Subgraph],
  versionInfo: {
    nodejs: "v22.10.12",
    ponder: "0.11.25",
    ensDb: "0.32.0",
    ensIndexer: "0.32.0",
    ensNormalize: "1.11.1",
  },
} satisfies EnsIndexerPublicConfig;

// Helper to create mock objects with consistent typing
export function createMockEnsNodeDbWriter(
  overrides: Partial<ReturnType<typeof baseEnsNodeDbWriter>> = {},
): EnsNodeDbWriter {
  return {
    ...baseEnsNodeDbWriter(),
    ...overrides,
  } as unknown as EnsNodeDbWriter;
}

export function createMockEnsDbWriterWorker(
  ensNodeDbWriter: EnsNodeDbWriter,
  publicConfigBuilder: PublicConfigBuilder,
  indexingStatusBuilder: IndexingStatusBuilder,
  migrationsDirPath: string = "/mock/migrations",
) {
  return new EnsDbWriterWorker(
    ensNodeDbWriter,
    publicConfigBuilder,
    indexingStatusBuilder,
    migrationsDirPath,
  );
}

export function baseEnsNodeDbWriter() {
  return {
    getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
    upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
    upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
    upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
    migrate: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockPublicConfigBuilder(
  resolvedConfig: EnsIndexerPublicConfig = publicConfig,
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
