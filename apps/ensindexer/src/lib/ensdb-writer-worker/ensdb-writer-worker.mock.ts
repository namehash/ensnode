import { vi } from "vitest";

import {
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
  type EnsIndexerPublicConfig,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";

import type { EnsDbClient } from "@/lib/ensdb-client/ensdb-client";
import * as ensDbClientMock from "@/lib/ensdb-client/ensdb-client.mock";
import type { IndexingStatusBuilder } from "@/lib/indexing-status-builder";
import type { PublicConfigBuilder } from "@/lib/public-config-builder";

// Helper to create mock objects with consistent typing
export function createMockEnsDbClient(
  overrides: Partial<ReturnType<typeof baseEnsDbClient>> = {},
): EnsDbClient {
  return {
    ...baseEnsDbClient(),
    ...overrides,
  } as unknown as EnsDbClient;
}

export function baseEnsDbClient() {
  return {
    getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
    upsertEnsDbVersion: vi.fn().mockResolvedValue(undefined),
    upsertEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
    upsertIndexingStatusSnapshot: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockPublicConfigBuilder(
  resolvedConfig: EnsIndexerPublicConfig = ensDbClientMock.publicConfig,
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
