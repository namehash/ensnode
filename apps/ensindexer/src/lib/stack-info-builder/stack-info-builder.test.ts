import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EnsDbReader } from "@ensnode/ensdb-sdk";
import {
  buildEnsIndexerStackInfo,
  type EnsIndexerPublicConfig,
  type EnsIndexerStackInfo,
} from "@ensnode/ensnode-sdk";
import type { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk/client";

import type { PublicConfigBuilder } from "@/lib/public-config-builder";

import { StackInfoBuilder } from "./stack-info-builder";

vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual = await vi.importActual("@ensnode/ensnode-sdk");

  return {
    ...actual,
    buildEnsIndexerStackInfo: vi.fn(),
  };
});

const mockEnsDbPublicConfig = {
  versionInfo: { postgresql: "17.4" },
};

const mockEnsIndexerPublicConfig = {
  ensIndexerSchemaName: "ensindexer_0",
  ensRainbowPublicConfig: {
    serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
    versionInfo: { ensRainbow: "1.9.0" },
  },
  clientLabelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: true,
  namespace: "mainnet",
  plugins: [],
  versionInfo: {
    ponder: "0.11.0",
    ensDb: "1.0.0",
    ensIndexer: "1.0.0",
    ensNormalize: "1.0.0",
  },
} satisfies EnsIndexerPublicConfig;

const mockEnsRainbowPublicConfig = {
  serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
  versionInfo: { ensRainbow: "1.9.0" },
};

const mockStackInfo = {
  ensDb: mockEnsDbPublicConfig,
  ensIndexer: mockEnsIndexerPublicConfig,
  ensRainbow: mockEnsRainbowPublicConfig,
} satisfies EnsIndexerStackInfo;

function createMockEnsDbReader(
  overrides: Partial<Pick<EnsDbReader, "buildEnsDbPublicConfig">> = {},
): EnsDbReader {
  return {
    buildEnsDbPublicConfig: vi.fn().mockResolvedValue(mockEnsDbPublicConfig),
    ...overrides,
  } as unknown as EnsDbReader;
}

function createMockEnsRainbowClient(
  overrides: Partial<Pick<EnsRainbowApiClient, "config">> = {},
): EnsRainbowApiClient {
  return {
    config: vi.fn().mockResolvedValue(mockEnsRainbowPublicConfig),
    ...overrides,
  } as unknown as EnsRainbowApiClient;
}

function createMockPublicConfigBuilder(
  overrides: Partial<Pick<PublicConfigBuilder, "getPublicConfig">> = {},
): PublicConfigBuilder {
  return {
    getPublicConfig: vi.fn().mockResolvedValue(mockEnsIndexerPublicConfig),
    ...overrides,
  } as unknown as PublicConfigBuilder;
}

describe("StackInfoBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStackInfo()", () => {
    it("builds stack info from ensDb, ensIndexer, and ensRainbow public configs", async () => {
      vi.mocked(buildEnsIndexerStackInfo).mockReturnValue(mockStackInfo);

      const ensDbClient = createMockEnsDbReader();
      const ensRainbowClient = createMockEnsRainbowClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();

      const builder = new StackInfoBuilder(ensDbClient, ensRainbowClient, publicConfigBuilder);
      const result = await builder.getStackInfo();

      expect(ensDbClient.buildEnsDbPublicConfig).toHaveBeenCalledOnce();
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledOnce();
      expect(ensRainbowClient.config).toHaveBeenCalledOnce();
      expect(buildEnsIndexerStackInfo).toHaveBeenCalledWith(
        mockEnsDbPublicConfig,
        mockEnsIndexerPublicConfig,
        mockEnsRainbowPublicConfig,
      );
      expect(result).toBe(mockStackInfo);
    });

    it("caches stack info and returns the same value on subsequent calls", async () => {
      vi.mocked(buildEnsIndexerStackInfo).mockReturnValue(mockStackInfo);

      const ensDbClient = createMockEnsDbReader();
      const ensRainbowClient = createMockEnsRainbowClient();
      const publicConfigBuilder = createMockPublicConfigBuilder();

      const builder = new StackInfoBuilder(ensDbClient, ensRainbowClient, publicConfigBuilder);

      const result1 = await builder.getStackInfo();
      const result2 = await builder.getStackInfo();

      expect(result1).toBe(result2);
      // Underlying dependencies should only be called once due to caching
      expect(ensDbClient.buildEnsDbPublicConfig).toHaveBeenCalledOnce();
      expect(publicConfigBuilder.getPublicConfig).toHaveBeenCalledOnce();
      expect(ensRainbowClient.config).toHaveBeenCalledOnce();
      expect(buildEnsIndexerStackInfo).toHaveBeenCalledOnce();
    });

    it("throws when buildEnsIndexerStackInfo throws", async () => {
      vi.mocked(buildEnsIndexerStackInfo).mockImplementation(() => {
        throw new Error("Stack info validation failed");
      });

      const builder = new StackInfoBuilder(
        createMockEnsDbReader(),
        createMockEnsRainbowClient(),
        createMockPublicConfigBuilder(),
      );

      await expect(builder.getStackInfo()).rejects.toThrow("Stack info validation failed");
    });

    it("propagates errors from ensDb client", async () => {
      const ensDbClient = createMockEnsDbReader({
        buildEnsDbPublicConfig: vi.fn().mockRejectedValue(new Error("ENSDB connection failed")),
      });

      const builder = new StackInfoBuilder(
        ensDbClient,
        createMockEnsRainbowClient(),
        createMockPublicConfigBuilder(),
      );

      await expect(builder.getStackInfo()).rejects.toThrow("ENSDB connection failed");
    });

    it("propagates errors from ensRainbow client", async () => {
      const ensRainbowClient = createMockEnsRainbowClient({
        config: vi.fn().mockRejectedValue(new Error("ENSRainbow not available")),
      });

      const builder = new StackInfoBuilder(
        createMockEnsDbReader(),
        ensRainbowClient,
        createMockPublicConfigBuilder(),
      );

      await expect(builder.getStackInfo()).rejects.toThrow("ENSRainbow not available");
    });

    it("propagates errors from public config builder", async () => {
      const publicConfigBuilder = createMockPublicConfigBuilder({
        getPublicConfig: vi.fn().mockRejectedValue(new Error("Config retrieval failed")),
      });

      const builder = new StackInfoBuilder(
        createMockEnsDbReader(),
        createMockEnsRainbowClient(),
        publicConfigBuilder,
      );

      await expect(builder.getStackInfo()).rejects.toThrow("Config retrieval failed");
    });
  });
});
